import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface DocumentationSuggestion {
  functionName?: string;
  className?: string;
  fileName: string;
  suggestedContent: string;
  confidence: number;
  type: 'function' | 'class' | 'module' | 'api';
}

export interface CommitAnalysis {
  summary: string;
  changesDescription: string;
  missingDocumentation: DocumentationSuggestion[];
  confidence: number;
}

export interface ProcessImprovement {
  pattern: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ReleaseNotesData {
  version: string;
  summary: string;
  features: string[];
  bugFixes: string[];
  breakingChanges: string[];
  documentation: string[];
}

export async function analyzeCommitForDocumentation(
  commitMessage: string,
  diff: string,
  filesChanged: string[]
): Promise<CommitAnalysis> {
  try {
    const systemPrompt = `You are an expert documentation assistant that analyzes Git commits to identify missing documentation.

Analyze the commit and provide:
1. A brief summary of what changed
2. A description of the changes
3. Any missing documentation that should be created
4. Confidence level (0-100)

For missing documentation, identify:
- Function names and their purpose
- Class names and their role
- File names where changes occurred
- Suggested documentation content
- Type of documentation needed (function, class, module, api)
- Confidence level for each suggestion`;

    const prompt = `Commit Message: ${commitMessage}

Files Changed: ${filesChanged.join(', ')}

Diff:
${diff.substring(0, 2000)}...

Analyze this commit and suggest documentation updates.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            changesDescription: { type: "string" },
            missingDocumentation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  functionName: { type: "string" },
                  className: { type: "string" },
                  fileName: { type: "string" },
                  suggestedContent: { type: "string" },
                  confidence: { type: "number" },
                  type: { type: "string", enum: ["function", "class", "module", "api"] }
                },
                required: ["fileName", "suggestedContent", "confidence", "type"]
              }
            },
            confidence: { type: "number" }
          },
          required: ["summary", "changesDescription", "missingDocumentation", "confidence"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: CommitAnalysis = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error) {
    console.error("Failed to analyze commit for documentation:", error);
    throw new Error(`Failed to analyze commit: ${error}`);
  }
}

export async function detectMissingDocumentation(
  commits: Array<{ message: string; author: string; timestamp: Date; filesChanged: string[] }>,
  existingDocs: Array<{ title: string; content: string; path: string }>
): Promise<ProcessImprovement[]> {
  try {
    const systemPrompt = `You are a documentation process improvement expert.
    
Analyze commits and existing documentation to identify patterns and suggest improvements.
Focus on:
- Commits without corresponding documentation
- Inconsistent documentation patterns
- Missing process documentation
- Opportunities for automation`;

    const commitsText = commits.map(c => 
      `${c.timestamp.toISOString()}: ${c.message} by ${c.author} (files: ${c.filesChanged.join(', ')})`
    ).join('\n');

    const docsText = existingDocs.map(d => 
      `${d.path}: ${d.title} - ${d.content.substring(0, 100)}...`
    ).join('\n');

    const prompt = `Recent Commits:
${commitsText}

Existing Documentation:
${docsText}

Identify patterns and suggest process improvements.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              description: { type: "string" },
              recommendation: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["pattern", "description", "recommendation", "priority"]
          }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: ProcessImprovement[] = JSON.parse(rawJson);
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Failed to detect missing documentation:", error);
    throw new Error(`Failed to detect missing documentation: ${error}`);
  }
}

export async function generateReleaseNotes(
  commits: Array<{ message: string; author: string; timestamp: Date; filesChanged: string[] }>,
  wikiUpdates: Array<{ title: string; content: string; lastModified: Date }>
): Promise<ReleaseNotesData> {
  try {
    const systemPrompt = `You are a technical writer that creates comprehensive release notes.
    
Analyze commits and wiki updates to generate structured release notes including:
- Version summary
- New features
- Bug fixes
- Breaking changes
- Documentation updates`;

    const commitsText = commits.map(c => 
      `${c.timestamp.toISOString()}: ${c.message} by ${c.author}`
    ).join('\n');

    const wikiText = wikiUpdates.map(w => 
      `${w.lastModified.toISOString()}: ${w.title} - ${w.content.substring(0, 100)}...`
    ).join('\n');

    const prompt = `Commits:
${commitsText}

Wiki Updates:
${wikiText}

Generate comprehensive release notes.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            version: { type: "string" },
            summary: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            bugFixes: { type: "array", items: { type: "string" } },
            breakingChanges: { type: "array", items: { type: "string" } },
            documentation: { type: "array", items: { type: "string" } }
          },
          required: ["version", "summary", "features", "bugFixes", "breakingChanges", "documentation"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: ReleaseNotesData = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error) {
    console.error("Failed to generate release notes:", error);
    throw new Error(`Failed to generate release notes: ${error}`);
  }
}

export async function answerDeveloperQuestion(
  question: string,
  context: {
    commits: Array<{ message: string; author: string; timestamp: Date; hash: string }>;
    docs: Array<{ title: string; content: string; path: string }>;
  }
): Promise<string> {
  try {
    const systemPrompt = `You are a knowledgeable development assistant with access to code commits and documentation.
    
Answer developer questions using the provided context. Be specific and cite sources when possible.
Include commit hashes, author names, and relevant documentation when answering.`;

    const commitsText = context.commits.map(c => 
      `Commit ${c.hash}: ${c.message} by ${c.author} on ${c.timestamp.toISOString()}`
    ).join('\n');

    const docsText = context.docs.map(d => 
      `Doc: ${d.path} - ${d.title}\n${d.content.substring(0, 200)}...`
    ).join('\n\n');

    const prompt = `Question: ${question}

Available Context:

Recent Commits:
${commitsText}

Documentation:
${docsText}

Please answer the question using the available context.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't generate a response to your question.";
  } catch (error) {
    console.error("Failed to answer developer question:", error);
    throw new Error(`Failed to answer question: ${error}`);
  }
}
