import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiReact } from "react-icons/si";
import { LuCopy } from "react-icons/lu";
import { LuCopyCheck } from "react-icons/lu";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

export function HeroSection() {
  return (
    <div className="flex lg:items-center lg:px-32 px-5 mt-20 gap-x-32 lg:flex-row flex-col">
      <div className="">
        <h2 className="text-5xl font-light">
          The missing backend <br /> framework for React.
        </h2>
        <div className="bg-white/5 border p-3 border-white/7 mt-5 flex items-center justify-between">
          <code className="text-sm">$ npx create-react-serve@latest</code>
          <CopyButton />
        </div>
        <Link to="/docs/at-a-glance">
          <button className="mt-5 bg-white text-black px-5 py-3 text-sm cursor-pointer">
            Learn ReactServe
          </button>
        </Link>
      </div>
      <div className="p-4 lg:ml-10 lg:mt-0 mt-5 flex-1 border border-white/10">
        <div className="text-xs px-4 py-2 flex gap-x-1 items-center border border-white/10 w-fit bg-white/4">
          <SiReact size={14} color="#61DAFB" />
          <span className="text-zinc-400">backend.tsx</span>
        </div>
        <div className="ext-sm font-mono p-4 rounded-b-lg">
          <SyntaxHighlighter
            language="jsx"
            style={tomorrow}
            customStyle={{
              background: "transparent",
              padding: 0,
              margin: 0,
              fontSize: "0.875rem",
            }}
          >
            {`<App port={6969}>
  <Route path="/" method="GET">
    {async () => {
      return <Response json={{ message: "Hello World!" }} />;
    }}
  </Route>

  <RouteGroup prefix="/api">
    <Middleware use={authMiddleware} />

    <Route path="/users/:id" method="GET">
      {async () => {
        const { params } = useRoute();
        const user = useContext("user");
        return <Response json={{ userId: params.id, currentUser: user }} />;
      }}
    </Route>
  </RouteGroup>
</App>`}
          </SyntaxHighlighter>
        </div>
        <div className="mt-4 flex justify-end"></div>
      </div>
    </div>
  );
}

function CopyButton() {
  const [copied, setCopied] = useState(false);
  const text = "$ npx create-react-serve@latest";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(el);
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy command"
      title={copied ? "Copied" : "Copy"}
    >
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
      {copied ? <LuCopyCheck size={20} /> : <LuCopy size={20} />}
    </button>
  );
}
