"use server";
import "server-only";
import {
	generatePayload,
	isLoggedIn as isLoggedInAction,
	type LoginParams,
	login,
	logout,
} from "../actions";

const isE2ETest = process.env.E2E_TEST_MODE === "true";

export const isLoggedIn = async (address: string) => {
	if (isE2ETest) {
		return true;
	}
	const authResult = await isLoggedInAction(address);
	return !!authResult;
};

export const doLogin = async (params: LoginParams) => {
	const res = await login(params);

	if (!res?.serverError || res.validationErrors) {
		throw new Error("Login failed");
	}
};

interface GetLoginPayload {
	address: string;
	chainId: number;
}
export const getLoginPayload = async ({
	address,
	chainId,
}: GetLoginPayload) => {
	const data = (await generatePayload({ address, chainId }))?.data;
	if (!data) {
		throw new Error("Failed to generate payload");
	}
	return data;
};

export const doLogout = async () => {
	await logout({ redirect: false });
};
