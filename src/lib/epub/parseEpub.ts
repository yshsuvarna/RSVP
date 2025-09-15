import JSZip from "jszip";
import { DOMParser } from "xmldom";

export interface EpubMetadata {
  title: string;
  creator: string;
  size: number;
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  text: string;
}

export async function parseEpub(file: File): Promise<ParsedEpub> {
  try {
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the EPUB with JSZip
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Read the container.xml to find the OPF file
    const containerXml = await zip.file("META-INF/container.xml")?.async("string");
    if (!containerXml) {
      throw new Error("Invalid EPUB: Missing container.xml");
    }

    const containerDoc = new DOMParser().parseFromString(containerXml, "text/xml");
    const opfPath = containerDoc.getElementsByTagName("rootfile")[0]?.getAttribute("full-path");
    if (!opfPath) {
      throw new Error("Invalid EPUB: Missing OPF file reference");
    }

    // Read the OPF file
    const opfContent = await zip.file(opfPath)?.async("string");
    if (!opfContent) {
      throw new Error("Invalid EPUB: OPF file not found");
    }

    const opfDoc = new DOMParser().parseFromString(opfContent, "text/xml");

    // Extract metadata
    const title = opfDoc.getElementsByTagName("dc:title")[0]?.textContent || "Unknown Title";
    const creator = opfDoc.getElementsByTagName("dc:creator")[0]?.textContent || "Unknown Author";

    // Get the spine (reading order)
    const spineItems = opfDoc.getElementsByTagName("itemref");
    const manifestItems = opfDoc.getElementsByTagName("item");

    // Create a map of id to href
    const idToHref = new Map();
    for (let i = 0; i < manifestItems.length; i++) {
      const item = manifestItems[i];
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) {
        idToHref.set(id, href);
      }
    }

    // Get the base path from the OPF file
    const opfBasePath = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

    // Extract text content in reading order
    let fullText = "";
    for (let i = 0; i < spineItems.length; i++) {
      const idref = spineItems[i].getAttribute("idref");
      if (idref) {
        const href = idToHref.get(idref);
        if (href) {
          const contentPath = opfBasePath + href;
          const content = await zip.file(contentPath)?.async("string");
          if (content) {
            // Parse HTML and extract text
            const htmlDoc = new DOMParser().parseFromString(content, "text/html");
            const textContent = extractTextFromNode(htmlDoc.documentElement);
            fullText += textContent + " ";
          }
        }
      }
    }

    return {
      metadata: {
        title,
        creator,
        size: file.size,
      },
      text: fullText.trim(),
    };
  } catch (error) {
    console.error("Error parsing EPUB:", error);
    throw new Error(`Failed to parse EPUB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Helper function to extract text from HTML nodes
function extractTextFromNode(node: Node): string {
  let text = "";

  if (node.nodeType === 3) {
    // Text node
    text = node.nodeValue || "";
  } else if (node.nodeType === 1) {
    // Element node
    const element = node as Element;
    const tagName = element.tagName?.toLowerCase();

    // Skip script and style tags
    if (tagName === "script" || tagName === "style") {
      return "";
    }

    // Add spacing for block elements
    const blockElements = ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "br"];
    if (blockElements.includes(tagName || "")) {
      text += "\n";
    }

    // Recursively extract text from children
    const childNodes = node.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      text += extractTextFromNode(childNodes[i]);
    }

    // Add spacing after block elements
    if (blockElements.includes(tagName || "")) {
      text += "\n";
    }
  }

  return text;
}