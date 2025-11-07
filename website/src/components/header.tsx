import { Link } from "@tanstack/react-router";
import { SiGithub } from "react-icons/si";

const links = [
  {
    title: "docs",
    href: "/docs/at-a-glance",
  },
  {
    title: "changelogs",
    href: "/changelogs",
  },
  {
    title: <SiGithub />,
    href: "https://github.com/akinloluwami/react-serve",
    target: "_blank",
  },
];

export function Header() {
  return (
    <div className="border-b border-white/10 flex items-center justify-between h-14">
      <Link className="px-4 flex items-center gap-x-2" to="/">
        <img
          src="https://akinkunmi.dev/projects/react-serve.png"
          alt=""
          className="w-8"
        />
        ReactServe
      </Link>
      <div className="flex items-center h-full">
        {links.map((link) => (
          <div
            key={link.href}
            className="border-l border-white/10 h-full flex px-4 items-center hover:bg-white/5 transition-colors"
          >
            <Link to={link.href} target={link.target}>
              {link.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
