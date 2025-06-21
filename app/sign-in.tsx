import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function SignIn() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to welcome screen since we only use Google OAuth
		router.replace("/welcome");
	}, [router]);

	return null;
}
