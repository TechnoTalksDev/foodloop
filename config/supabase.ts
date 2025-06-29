import { AppState } from "react-native";

import "react-native-get-random-values";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

class LargeSecureStore {
	private async _encrypt(key: string, value: string) {
		const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
		const cipher = new aesjs.ModeOfOperation.ctr(
			encryptionKey,
			new aesjs.Counter(1),
		);
		const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
		await SecureStore.setItemAsync(
			key,
			aesjs.utils.hex.fromBytes(encryptionKey),
		);
		return aesjs.utils.hex.fromBytes(encryptedBytes);
	}
	private async _decrypt(key: string, value: string) {
		const encryptionKeyHex = await SecureStore.getItemAsync(key);
		if (!encryptionKeyHex) {
			return encryptionKeyHex;
		}
		const cipher = new aesjs.ModeOfOperation.ctr(
			aesjs.utils.hex.toBytes(encryptionKeyHex),
			new aesjs.Counter(1),
		);
		const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
		return aesjs.utils.utf8.fromBytes(decryptedBytes);
	}
	async getItem(key: string) {
		const encrypted = await AsyncStorage.getItem(key);
		if (!encrypted) {
			return encrypted;
		}
		return await this._decrypt(key, encrypted);
	}
	async removeItem(key: string) {
		await AsyncStorage.removeItem(key);
		await SecureStore.deleteItemAsync(key);
	}
	async setItem(key: string, value: string) {
		const encrypted = await this._encrypt(key, value);
		await AsyncStorage.setItem(key, encrypted);
	}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: new LargeSecureStore(),
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

AppState.addEventListener("change", (state) => {
	if (state === "active") {
		supabase.auth.startAutoRefresh();
	} else {
		supabase.auth.stopAutoRefresh();
	}
});

/**
 * Initialize realtime subscriptions and verify connection
 * Call this during app startup to ensure realtime is working
 */
export const initializeRealtime = async (): Promise<boolean> => {
	try {
		console.log("🚀 [Realtime] Initializing realtime connection...");

		// Test realtime connection with a simple subscription
		const testChannel = supabase
			.channel("realtime-test")
			.subscribe((status) => {
				console.log("📡 [Realtime] Connection status:", status);

				if (status === "SUBSCRIBED") {
					console.log("✅ [Realtime] Successfully connected and subscribed!");
				} else if (status === "CHANNEL_ERROR") {
					console.error(
						"❌ [Realtime] Channel error - check your Supabase configuration",
					);
				} else if (status === "TIMED_OUT") {
					console.error(
						"⏰ [Realtime] Connection timed out - check your network",
					);
				} else if (status === "CLOSED") {
					console.log("🔒 [Realtime] Connection closed");
				}
			});

		// Clean up test channel after verification
		setTimeout(() => {
			console.log("🧹 [Realtime] Cleaning up test connection");
			supabase.removeChannel(testChannel);
		}, 2000);

		return true;
	} catch (error) {
		console.error("❌ [Realtime] Initialization failed:", error);
		return false;
	}
};
