import { SiGithub } from "react-icons/si";

export function GitHubSection() {
  return (
    <div className="my-42">
      <div className="max-w-4xl mx-auto text-center px-8">
        <h2 className="text-4xl font-light mb-6">⭐ Star on GitHub</h2>
        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          Do you think it's cool or cursed? Show some love either way.
        </p>
        <a
          href="https://github.com/akinloluwami/react-serve"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <SiGithub size={24} />
          Star on GitHub
        </a>
      </div>
    </div>
  );
}
