# The Brief

Build a RAG / agentic application that helps users find a pet that fits their lifestyle and preferences.

Users should be able to describe their living situation, daily routines, experience with pets, and any preferences or constraints they have. The system should then use this information to suggest suitable pets or dog breeds, along with explanations of why they might be a good match.

This is a good case for exploring agentic and retrieval-augmented patterns because the system needs to:

Understand loosely structured user input about lifestyle and preferences
Retrieve relevant information about pets and breeds from external sources or datasets
Combine retrieved knowledge with model reasoning to generate recommendations
Compare different pets or breeds in a meaningful way based on user context
Translate data (e.g. size, energy level, temperament) into human-readable advice

# Other ideas

* Ask the user questions and based on that suggest what breed best represent their personality.
* Maybe recommend other animals then dogs, some users maybe would be better of with a goldfish or maybe a highland cow.


# Dog API + LiteLLM Agent Boilerplate

This  demonstrates how to build a simple AI agent using:

- LiteLLM-compatible chat completions
- Tool calling / function calling
- External REST APIs
- TypeScript
- Node.js

The agent can dynamically call the Dog API when the model decides it needs external information about dog breeds.

---

# Overview

The boilerplate consists of:

| File | Purpose |
|---|---|
| `dog-api.ts` | Main AI agent implementation |
| `package.json` | Dependencies and scripts |
| `instructions.md` | Documentation and setup guide |

---

# APIs Used

## 1. LiteLLM Chat Completions API

This endpoint provides OpenAI-compatible chat completions.

Go to this solita page to get your litellm key:
https://insider.solita.fi/sites/generative-ai/news/28723/launching-litellm-api-keys-for-competence-development-and-access-to-mcp-servers-in-github-copilot

### Endpoint

```txt
https://app-litellmsn66ka.azurewebsites.net/v1/chat/completions
```

### Authentication

```http
Authorization: Bearer YOUR_API_KEY
```

### Example Request

```ts
const response = await fetch(BASE_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-pro',
    messages,
    tools,
    tool_choice: 'auto',
  }),
});
```

---

## 2. TheDogAPI

Used as an external tool source for dog breed data.

Official website adn documentation:

https://thedogapi.com

### Endpoint for getting dog breeds and their information

```txt
https://api.thedogapi.com/v1/breeds
```

### Authentication

You can register a free account to get the dog api key ( no payment credentials neccesary )

```http
x-api-key: YOUR_DOG_API_KEY
```

### Example Request

```ts
const response = await fetch(
  'https://api.thedogapi.com/v1/breeds',
  {
    headers: {
      'x-api-key': DOG_API_KEY,
    },
  },
);
```

---

# How Tool Calling Works

The AI model does not directly call APIs.

Instead:

1. The model requests a tool
2. Your Node.js code executes the tool
3. The tool result is sent back to the model
4. The model generates a final answer

This is the standard architecture used by modern AI agents.

---

# Project Setup

## Install Dependencies

```bash
npm install
```

---

# Run The Project

```bash
npm test
```

This runs:

```bash
npx tsx dog-api.ts
```

---

# Example Prompt

Inside `main()`:

```ts
const response = await runAgent(
  'Tell me about huskies and recommend a family-friendly dog breed.',
);
```

The model may decide to call:

```ts
get_dog_breeds()
```

Which internally fetches data from:

```txt
https://api.thedogapi.com/v1/breeds
```

---

# Boilerplate Architecture

## 1. Tool Definition

The model needs a schema describing available tools.

```ts
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_dog_breeds',
      description:
        'Get dog breed information',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
          },
        },
      },
    },
  },
];
```

---

## 2. Tool Execution

Your application executes the tool manually.

```ts
switch (functionName) {
  case 'get_dog_breeds':
    toolResult = await getDogBreeds(
      args.search,
    );
    break;
}
```

---

## 3. Returning Tool Results

Tool results are added back into the conversation.

```ts
messages.push({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: JSON.stringify(toolResult),
});
```

---

## 4. Final Model Response

The model receives the tool output and generates a natural language response.

---

# Example Flow

```txt
User Prompt
   ↓
LLM decides tool is needed
   ↓
Tool call returned
   ↓
Node.js executes Dog API request
   ↓
Tool result appended to messages
   ↓
LLM generates final answer
```


## Streaming Responses

Add support for:

```txt
stream: true
```

to receive tokens in real time.

---

# Troubleshooting

## Error: 401 Unauthorized

Check:

- LiteLLM API key
- Dog API key

---

## Error: fetch failed

Possible causes:

- Network issues
- Invalid endpoint
- API downtime

---

## Model Does Not Call Tool

Try stronger prompts:

```txt
Use tools whenever external data is required.
```

or:

```txt
Always use the dog breed tool for breed questions.
```

---

# Useful Links

## LiteLLM

https://docs.litellm.ai

## TheDogAPI

https://thedogapi.com

## OpenAI Tool Calling Spec

https://platform.openai.com/docs/guides/function-calling

---

# Summary

This boilerplate demonstrates:

- AI agents
- Tool calling
- External API integration
- OpenAI-compatible APIs
- TypeScript agent architecture

It is intentionally simple and designed to be easy to extend into larger autonomous agent systems.