import { useState, useEffect } from "react";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";

export function useOnboarding() {
	const { session } = useAuth();
	const [isOnboardingComplete, setIsOnboardingComplete] = useState<
		boolean | null
	>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkOnboardingStatus();
	}, [session?.user?.id]);

	const checkOnboardingStatus = async () => {
		if (!session?.user?.id) {
			setLoading(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("users")
				.select("onboarding_complete")
				.eq("id", session.user.id)
				.single();

			if (error) {
				console.error("Error checking onboarding status:", error);
				setIsOnboardingComplete(null);
			} else {
				setIsOnboardingComplete(data?.onboarding_complete ?? false);
			}
		} catch (error) {
			console.error("Error in checkOnboardingStatus:", error);
			setIsOnboardingComplete(null);
		} finally {
			setLoading(false);
		}
	};

	const completeOnboarding = async () => {
		if (!session?.user?.id) return false;

		try {
			const { error } = await supabase
				.from("users")
				.update({ onboarding_complete: true })
				.eq("id", session.user.id);

			if (error) {
				console.error("Error completing onboarding:", error);
				return false;
			}

			setIsOnboardingComplete(true);
			return true;
		} catch (error) {
			console.error("Error in completeOnboarding:", error);
			return false;
		}
	};

	return {
		isOnboardingComplete,
		loading,
		completeOnboarding,
		refetch: checkOnboardingStatus,
	};
}
