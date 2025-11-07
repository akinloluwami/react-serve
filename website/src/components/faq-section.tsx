export function FaqSection() {
  const parseAnswer = (text: string | undefined) => {
    if (!text || typeof text !== "string") return text;
    const parts = text.split(/(`[^`]*`|\[(?:[^\]]+)\]\((?:[^)]+)\))/g);
    return parts.map((part, index) => {
      if (!part) return "";
      if (part.startsWith("`") && part.endsWith("`")) {
        const code = part.slice(1, -1);
        return (
          <code key={index} className="bg-white/10 px-1 rounded">
            {code}
          </code>
        );
      } else if (part.startsWith("[")) {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const linkText = match[1];
          const url = match[2];
          return (
            <a key={index} href={url} className="underline" target="_blank">
              {linkText}
            </a>
          );
        }
      }
      return part;
    });
  };

  const faqs = [
    {
      question: "WTF is this?",
      answer:
        "ReactServe is a backend framework that transforms JSX components into Express.js routes.",
    },
    {
      question: "Does it compile to HTML?",
      answer:
        "No. 💀💀💀 It compiles to Express.js route handlers. It's not a frontend framework.",
    },
    {
      question: "Is this secure?",
      answer: "Yes. It doesn't run in the browser. You're fine.",
    },
    {
      question: "Why does this exist?",
      answer: "[@xt42io](https://x.com/xt42io) was bored and curious.",
    },
  ];

  return (
    <div className="mt-42">
      {/* <h1 className="text-5xl font-light text-center">FAQ.</h1> */}
      <div className="max-w-4xl mx-auto mt-12 px-8 space-y-2">
        {faqs.map((faq, index) => (
          <div key={index} className="border-white/10 p-8">
            <h3 className="text-3xl font-light mb-4">{faq.question}</h3>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {parseAnswer(faq.answer)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
