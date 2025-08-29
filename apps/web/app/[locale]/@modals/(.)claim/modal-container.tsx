"use client";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { Dialog, DialogOverlay } from "@mjs/ui/primitives/dialog";
import { ReactNode, useState } from "react";

export const FixModalCloseBug = ({
	expectedPath,
	children,
}: {
	expectedPath: string | RegExp;
	children: ReactNode;
}) => {
	const pathname = usePathname();

	if (expectedPath instanceof RegExp) {
		if (expectedPath.test(pathname)) {
			return <DialogClient>{children}</DialogClient>;
		}
		return null;
	} else if (pathname.includes(expectedPath)) {
		return <DialogClient>{children}</DialogClient>;
	}
	return null;
};

const DialogClient = ({ children }: { children: ReactNode }) => {
	const [open, setOpen] = useState(true);
	const router = useRouter();
	const handleOpenChange = (open: boolean) => {
		setOpen(open);
		if (!open) {
			router.back();
		}
	};
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{children}
			<DialogOverlay />
		</Dialog>
	);
};
