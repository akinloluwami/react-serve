import {
  App,
  Route,
  RouteGroup,
  Response,
  useRoute,
  serve,
  //@ts-ignore
} from "../../packages/react-serve-js/src";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

export default function Backend() {
  return (
		<App port={3000}>
			<Route path="/" method="GET">
				{async () => {
					return (
						<Response
							json={{ message: "Welcome to ReactServe!" }}
						/>
					);
				}}
			</Route>

			<RouteGroup prefix="/api">
				<Route path="/users" method="GET">
					{async () => {
						return <Response json={mockUsers} />;
					}}
				</Route>

				<Route path="/users" method="POST">
					{async () => {
						const { body } = useRoute();
						if (!body || !body.name || !body.email) {
							return (
								<Response
									status={400}
									json={{
										error: "Name and email are required",
									}}
								/>
							);
						}
						const newUser = {
							id: mockUsers.length + 1,
							name: body.name,
							email: body.email,
						};
						mockUsers.push(newUser);
						return <Response status={201} json={newUser} />;
					}}
				</Route>

				<Route path="/users/:id" method="GET">
					{async () => {
						const { params } = useRoute();
						const user = mockUsers.find(
							(u) => u.id === Number(params.id)
						);
						return user ? (
							<Response json={user} />
						) : (
							<Response
								status={404}
								json={{ error: "User not found" }}
							/>
						);
					}}
				</Route>

				<Route path="/health" method="GET">
					{async () => {
						return (
							<Response
								json={{
									status: "OK",
									timestamp: new Date().toISOString(),
								}}
							/>
						);
					}}
				</Route>
			</RouteGroup>

			<RouteGroup prefix="/v1">
				<RouteGroup prefix="/admin">
					<Route path="/stats" method="GET">
						{async () => {
							return (
								<Response
									json={{ totalUsers: mockUsers.length }}
								/>
							);
						}}
					</Route>
				</RouteGroup>
			</RouteGroup>
		</App>
  );
}

// Start the server
serve(Backend());
