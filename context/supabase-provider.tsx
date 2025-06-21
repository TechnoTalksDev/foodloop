import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";
import { SplashScreen, useRouter } from "expo-router";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { Session } from "@supabase/supabase-js";

import { supabase } from "@/config/supabase";

SplashScreen.preventAutoHideAsync();

// Required for web only
WebBrowser.maybeCompleteAuthSession();

type AuthState = {
	initialized: boolean;
	session: Session | null;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
	initialized: false,
	session: null,
	signInWithGoogle: async () => {},
	signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
	const [initialized, setInitialized] = useState(false);
	const [session, setSession] = useState<Session | null>(null);
	const router = useRouter();

	// Use explicit URL scheme that matches app.json configuration
	const redirectTo = "foodloop://auth";

	// Debug: Let's see what we're using vs what makeRedirectUri() generates
	console.log("Redirect URI being used:", redirectTo);
	console.log("makeRedirectUri() would generate:", makeRedirectUri());

	const createSessionFromUrl = async (url: string) => {
		try {
			console.log("Processing OAuth URL:", url);
			const { params, errorCode } = QueryParams.getQueryParams(url);

			if (errorCode) {
				console.error("OAuth error:", errorCode);
				throw new Error(errorCode);
			}

			const { access_token, refresh_token } = params;
			console.log("OAuth tokens received:", {
				hasAccessToken: !!access_token,
				hasRefreshToken: !!refresh_token,
			});

			if (!access_token) return;

			const { data, error } = await supabase.auth.setSession({
				access_token,
				refresh_token,
			});

			if (error) {
				console.error("Session creation error:", error);
				throw error;
			}

			console.log("Session created successfully:", data.session?.user?.email);
			return data.session;
		} catch (error) {
			console.error("Error in createSessionFromUrl:", error);
		}
	};

	const signInWithGoogle = async () => {
		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo,
					skipBrowserRedirect: true,
				},
			});

			if (error) throw error;

			const res = await WebBrowser.openAuthSessionAsync(
				data?.url ?? "",
				redirectTo,
			);

			if (res.type === "success") {
				const { url } = res;
				await createSessionFromUrl(url);
			}
		} catch (error) {
			console.error("Error signing in with Google:", error);
		}
	};

	// Handle linking into app from OAuth redirect - using the pattern from docs
	const url = Linking.useURL();
	if (url) {
		console.log("Received OAuth redirect URL:", url);
		createSessionFromUrl(url);
	}

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return;
		} else {
			console.log("User signed out");
		}
	};
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		setInitialized(true);
	}, []);

	useEffect(() => {
		if (initialized) {
			SplashScreen.hideAsync();
			if (session) {
				router.replace("/");
			} else {
				router.replace("/welcome");
			}
		}
		// eslint-disable-next-line
	}, [initialized, session]);

	return (
		<AuthContext.Provider
			value={{
				initialized,
				session,
				signInWithGoogle,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
