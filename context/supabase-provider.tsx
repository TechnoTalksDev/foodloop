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
import * as AuthSession from "expo-auth-session";

import { Session } from "@supabase/supabase-js";

import { supabase } from "@/config/supabase";

SplashScreen.preventAutoHideAsync();
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

	// ✅ Use dynamic redirect URI for Expo Go (no scheme override)
	const redirectTo = makeRedirectUri()
	console.log("🔁 Redirect URI being used:", redirectTo);

	const createSessionFromUrl = async (url: string) => {
		try {
			console.log("🔄 Processing OAuth URL:", url);
			const { params, errorCode } = QueryParams.getQueryParams(url);

			if (errorCode) {
				console.error("❌ OAuth error:", errorCode);
				throw new Error(errorCode);
			}

			const { access_token, refresh_token } = params;
			console.log("📦 OAuth tokens received:", {
				hasAccessToken: !!access_token,
				hasRefreshToken: !!refresh_token,
			});

			if (!access_token) {
				console.warn("⚠️ No access token found in redirect URL.");
				return;
			}

			const { data, error } = await supabase.auth.setSession({
				access_token,
				refresh_token,
			});

			if (error) {
				console.error("❌ Session creation error:", error);
				throw error;
			}

			console.log("✅ Session created successfully:", data.session?.user?.email);
			return data.session;
		} catch (error) {
			console.error("🔥 Error in createSessionFromUrl:", error);
		}
	};

	const signInWithGoogle = async () => {
		try {
			console.log("➡️ Starting Google OAuth with redirectTo:", redirectTo);
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo,
					skipBrowserRedirect: true,
				},
			});

			if (error) {
				console.error("❌ Supabase signInWithOAuth error:", error);
				throw error;
			}

			console.log("🌐 Opening OAuth URL:", data?.url);
			const res = await WebBrowser.openAuthSessionAsync(
				data?.url ?? "",
				redirectTo,
			);

			console.log("📥 WebBrowser result:", res);

			if (res.type === "success" && res.url) {
				await createSessionFromUrl(res.url);
			} else {
				console.warn("⚠️ OAuth flow was cancelled or failed.");
			}
		} catch (error) {
			console.error("🔥 Error signing in with Google:", error);
		}
	};

	// ✅ useEffect to ensure it captures URL when redirect happens
	const url = Linking.useURL();
	useEffect(() => {
		if (url) {
			console.log("🔗 Received OAuth redirect URL via Linking:", url);
			createSessionFromUrl(url);
		}
	}, [url]);

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("❌ Error signing out:", error);
			return;
		} else {
			console.log("✅ User signed out");
		}
	};

	useEffect(() => {
		console.log("🔁 Initializing Supabase session...");
		supabase.auth.getSession().then(({ data: { session } }) => {
			console.log("📥 Initial session:", session);
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			console.log("🔄 Auth state changed:", session);
			setSession(session);
		});

		setInitialized(true);
	}, []);

	useEffect(() => {
		if (initialized) {
			console.log("🚀 App initialized. Routing...");
			SplashScreen.hideAsync();
			if (session) {
				console.log("🔐 User authenticated, checking onboarding status...");
				checkOnboardingStatus();
			} else {
				console.log("👋 No session found, redirecting to welcome...");
				router.replace("/welcome");
			}
		}
	}, [initialized, session]);

	const checkOnboardingStatus = async () => {
		if (!session?.user?.id) return;
		
		try {
			const { data, error } = await supabase
				.from("users")
				.select("onboarding_complete")
				.eq("id", session.user.id)
				.single();
			
			if (error) {
				console.error("Error checking onboarding status:", error);
				router.replace("/");
				return;
			}
			
			if (data?.onboarding_complete === false) {
				console.log("🎯 User needs to complete onboarding");
				router.replace("/onboarding");
			} else {
				console.log("✅ User has completed onboarding, redirecting to home");
				router.replace("/");
			}
		} catch (error) {
			console.error("Error checking onboarding status:", error);
			router.replace("/");
		}
	};

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
