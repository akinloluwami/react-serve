import { App, Route, Response, serve } from "react-serve-js";

function Backend() {
  return (
    <App port={6969} parseBody={true}>
      <Route path="/" method="GET">
        {async () => {
          return <Response json={{ message: "Hello World" }} />;
        }}
      </Route>
    </App>
  );
}

serve(<Backend />);
