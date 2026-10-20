export const INITIAL_GOLDEN_PAIRS = [
  {
    concept_name: "API key security",
    test_question: "Explain why API keys should not be exposed in client-side code and how they should be protected in production web applications.",
    correct_answer: "API keys that grant privileged database or backend access must only be stored in secure server-side environment variables and accessed by backend services. Client-side browser code is completely public—anyone can inspect network requests, source maps, or bundled JavaScript to extract keys. If an API key is needed on the frontend, it must either be restricted by origin/scope with read-only permissions, or requests must be proxied through a backend API endpoint that enforces authentication, rate limiting, and session verification."
  },
  {
    concept_name: "App memory",
    test_question: "Explain how memory management works in modern web applications and what causes memory leaks in JavaScript.",
    correct_answer: "App memory is allocated on the heap and managed via automatic garbage collection, which tracks references starting from root objects. A memory leak occurs when unused objects or data retain unintended references—such as un-cleared setInterval/setTimeout timers, lingering event listeners on detached DOM elements, global variables, or closures holding large scopes—preventing the garbage collector from reclaiming that memory, which leads to bloated RAM usage and crashes."
  },
  {
    concept_name: "Foreign key placement",
    test_question: "In relational database design, which table gets the foreign key in a one-to-many relationship, and why?",
    correct_answer: "In a one-to-many relationship, the foreign key must be placed on the 'many' side (the child table) referencing the primary key of the 'one' side (the parent table). This is because each child record corresponds to exactly one parent, allowing a single scalar foreign key column. Placing it on the parent side would require storing an array or multiple parent rows for child IDs, which violates First Normal Form (1NF) and breaks relational integrity."
  }
];
