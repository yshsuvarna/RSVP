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
    const idToHref: { [key: string]: string } = {};
    for (let i = 0; i < manifestItems.length; i++) {
      const item = manifestItems[i];
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) {
        idToHref[id] = href;
      }
    }
    
    // Extract text from spine items in order
    const textParts: string[] = [];
    
    for (let i = 0; i < spineItems.length; i++) {
      const itemRef = spineItems[i];
      const idref = itemRef.getAttribute("idref");
      if (!idref || !idToHref[idref]) continue;
      
      const href = idToHref[idref];
      const fullPath = opfPath.includes("/") 
        ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) + href
        : href;
      
      const xhtmlContent = await zip.file(fullPath)?.async("string");
      if (!xhtmlContent) continue;
      
      // Parse XHTML and extract text
      const xhtmlDoc = new DOMParser().parseFromString(xhtmlContent, "text/html");
      const textContent = extractTextFromElement(xhtmlDoc.documentElement);
      if (textContent.trim()) {
        textParts.push(textContent.trim());
      }
    }
    
    const fullText = textParts.join("\n\n");
    
    return {
      metadata: {
        title,
        creator,
        size: file.size
      },
      text: fullText
    };
    
  } catch (error) {
    throw new Error(`Failed to parse EPUB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function extractTextFromElement(element: Element): string {
  let text = "";
  
  if (element.nodeType === 3) { // Text node
    return element.textContent || "";
  }
  
  if (element.nodeType === 1) { // Element node
    // Skip script and style elements
    if (element.tagName === "SCRIPT" || element.tagName === "STYLE") {
      return "";
    }
    
    // Process child nodes
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === 1) { // Element
        text += extractTextFromElement(child as Element);
      } else if (child.nodeType === 3) { // Text
        text += child.textContent || "";
      }
    }
    
    // Add line breaks for block elements
    const blockElements = ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BR", "LI"];
    if (blockElements.includes(element.tagName)) {
      text += "\n";
    }
  }
  
  return text;
}
