// const ADOBE_API_BASE_URL = process.env.NEXT_PUBLIC_ADOBE_BASE_URL;
// const ADOBE_API_KEY = process.env.ADOBE_TOKEN;
// const ADOBE_USERNAME = process.env.NEXT_PUBLIC_ADOBE_USERNAME;

// export const adobeAxios = axios.create({
// 	baseURL: ADOBE_API_BASE_URL,
// 	headers: {
// 		"Content-Type": "application/json",
// 		"x-api-user": `email:${ADOBE_USERNAME}`,
// 		Authorization: ADOBE_API_KEY,
// 	},
// });

// export const adobeCall = async ({
// 	method,
// 	url,
// 	data,
// 	headers,
// 	...rest
// }: Partial<AxiosRequestConfig>) => {
// 	try {
// 		const { data: responseData } = await adobeAxios({
// 			method,
// 			url: `${ADOBE_API_BASE_URL}${url}`,
// 			headers: {
// 				"Content-Type": "application/json",
// 				"x-api-user": `email:${ADOBE_USERNAME}`,
// 				Authorization: ADOBE_API_KEY,
// 				...headers,
// 			},
// 			...(data ? { data: data } : {}),
// 			...rest,
// 		});

// 		return responseData;
// 	} catch (e) {
// 		throw new Error(`Error making Adobe API call: ${e?.message}`);
// 	}
// };

// async function fetchDataWithRetry(url, retryCount = 0) {
// 	try {
// 		const response = await axios({
// 			url: `${ADOBE_API_BASE_URL}${url}`,
// 			headers: {
// 				"Content-Type": "application/json",
// 				"x-api-user": `email:${ADOBE_USERNAME}`,
// 				Authorization: ADOBE_API_KEY,
// 			},
// 		});
// 		return response.data;
// 	} catch (error) {
// 		if (retryCount < 4) {
// 			await wait(4000);
// 			return fetchDataWithRetry(url, retryCount + 1);
// 		}
// 		throw error;
// 	}
// }

// export async function createContract(
// 	contract: string,
// 	email: string,
// ): Promise<UrlContract & { agreementId?: string }> {
// 	const formData = createFormData(contract);
// 	const paramObj = {
// 		method: "POST",
// 		url: "transientDocuments",
// 		data: formData,
// 		headers: {
// 			"Content-Type": "application/form-data",
// 		},
// 	};
// 	try {
// 		const { transientDocumentId } = await adobeCall(paramObj);

// 		if (transientDocumentId) {
// 			const transientId = transientDocumentId;
// 			const formData = createJson(transientId, email);
// 			const agreementId = await adobeCall({
// 				method: "POST",
// 				url: "agreements",
// 				data: formData,
// 			});
// 			let isSign: UrlContract["isSign"] = false;
// 			let urlSign: UrlContract["urlSign"] = "";
// 			if (agreementId?.id) {
// 				const { isSign: signStatus, urlSign: signUrl } = await urlContract(
// 					agreementId.id,
// 				);
// 				isSign = signStatus;
// 				urlSign = signUrl;
// 			}
// 			return {
// 				agreementId: agreementId.id,
// 				isSign,
// 				urlSign,
// 			};
// 		}
// 		return { isSign: false, urlSign: null };
// 	} catch (error) {
// 		console.error(error);
// 		throw new Error("Error creating transient document");
// 	}
// }

// export type UrlContract = {
// 	urlSign: string | null;
// 	isSign: boolean;
// };

// export async function urlContract(agreementId: string): Promise<UrlContract> {
// 	try {
// 		const data = await adobeCall({
// 			method: "GET",
// 			url: `agreements/${agreementId}/members`,
// 		});
// 		const isSign = data?.participantSets?.[0]?.status as SignStatus;

// 		if (isSign === SignStatus.COMPLETED) {
// 			return { isSign: true, urlSign: null };
// 		} else {
// 			const data = await fetchDataWithRetry(
// 				`agreements/${agreementId}/signingUrls`,
// 			);
// 			const urlSign: string | null =
// 				data?.signingUrlSetInfos?.[0]?.signingUrls?.[0]?.esignUrl ?? null;
// 			return { isSign: false, urlSign };
// 		}
// 	} catch (error) {
// 		throw new Error(`Error fetching agreement data: ${error?.message}`);
// 	}
// }

// function createFormData(text) {
// 	const formData = new FormData();
// 	formData.append("File-Name", "Contract");
// 	formData.append("Mime-type", ".pdf");
// 	formData.append("File", text);
// 	return formData;
// }

// function createJson(transientId, email) {
// 	return {
// 		fileInfos: [
// 			{
// 				transientDocumentId: transientId,
// 			},
// 		],
// 		name: "Contract",
// 		participantSetsInfo: [
// 			{
// 				memberInfos: [
// 					{
// 						email,
// 						securityOption: {
// 							authenticationMethod: "NONE",
// 						},
// 					},
// 				],
// 				order: 1,
// 				role: "SIGNER",
// 			},
// 		],
// 		signatureType: "ESIGN",

// 		emailOption: {
// 			sendOptions: {
// 				completionEmails: "NONE",
// 				inFlightEmails: "NONE",
// 				initEmails: "NONE",
// 			},
// 		},
// 		externalId: { id: "Smat_ID" },
// 		state: "IN_PROCESS",
// 	};
// }
// function wait(ms) {
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, ms);
// 	});
// }
