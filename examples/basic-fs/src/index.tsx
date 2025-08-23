import { App } from "react-serve-js";

export default function Backend() {
  return <App port={7070} cors={true} globalPrefix="/api" />;
}


