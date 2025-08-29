import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@mjs/ui/primitives/dialog";
import { MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ContactFormModal } from "@/components/ContactForm";
import ClaimForm from "@/components/claim/form";
import { getQuestData } from './get-quest-data';


export default async function ClaimFormPage({ searchParams }: PageProps) {
	const [t, { id }] = await Promise.all([
		getTranslations("ClaimForm"),
		searchParams,
	]);

	if (!id) {
		redirect("/");
	}

	const quest = await getQuestData(id?.toString());

	if (!quest) {
		redirect("/");
	}

	return (
		<ContactFormModal>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5" />
						{t("title")}
					</DialogTitle>
					<DialogDescription className="text-secondary-300">
						{t("description")}
					</DialogDescription>
				</DialogHeader>
				<ClaimForm id={quest.id} inputs={quest.inputs} expiration={quest.expiration} results={quest.results} />
			</DialogContent>
		</ContactFormModal>
	);
}

export const revalidate = 3600 // 1 hour;
