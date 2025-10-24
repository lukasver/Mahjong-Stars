"use client";

import { FileUpload } from "@mjs/ui/components/file-upload";
import {
  Dialog,
  DialogContent
} from "@mjs/ui/primitives/dialog";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useRef, useState } from "react";
import { Camera, CameraType } from "react-camera-pro";
import AccountProvider from "@/components/thirdweb/account-provider";
import AutoConnect from "@/components/thirdweb/autoconnect";

export default function Page() {
  // const [selectedValue, setSelectedValue] = useState<string>("");

  // // Example options with grouping
  // const groupedOptions = [
  //   { id: "1", value: "apple", label: "Apple", meta: { category: "Fruits" } },
  //   { id: "2", value: "banana", label: "Banana", meta: { category: "Fruits" } },
  //   { id: "3", value: "orange", label: "Orange", meta: { category: "Fruits" } },
  //   {
  //     id: "4",
  //     value: "carrot",
  //     label: "Carrot",
  //     meta: { category: "Vegetables" },
  //   },
  //   {
  //     id: "5",
  //     value: "broccoli",
  //     label: "Broccoli",
  //     meta: { category: "Vegetables" },
  //   },
  //   {
  //     id: "6",
  //     value: "spinach",
  //     label: "Spinach",
  //     meta: { category: "Vegetables" },
  //   },
  //   { id: "7", value: "milk", label: "Milk", meta: { category: "Dairy" } },
  //   { id: "8", value: "cheese", label: "Cheese", meta: { category: "Dairy" } },
  // ];

  // const { data: tx, isLoading } = useTransactionById(
  //   "cmfe9bsvz00038o80h9injmnc" as string,
  // );

  // if (isLoading) {
  //   return <div>Loading testpage...</div>;
  // }

  // if (!tx?.transaction) {
  //   return <div>Transaction not found</div>;
  // }

  const [open, setOpen] = useState(false);
  const cameraRef = useRef<CameraType>(null);

  return (
    <NuqsAdapter>
      <AutoConnect />
      <AccountProvider>
        <Dialog
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
          }}
        >
          <div className="h-screen w-screen grid place-items-center">
            <div className="max-w-4xl w-full flex flex-col gap-8 justify-center">
              <h1>test</h1>
              <FileUpload type="camera"
                label="Take Picture"
              />
              <DialogContent className="w-full h-[90%] max-w-3xl sm:max-w-3xl flex flex-col">
                <div className="relative w-full flex-1">
                  {open && (
                    <Camera
                      ref={cameraRef}
                      aspectRatio={"cover"}
                      facingMode="user"
                      errorMessages={{
                        noCameraAccessible:
                          "No camera device accessible. Please connect your camera or try a different browser.",
                        permissionDenied:
                          "Permission denied. Please refresh and give camera permission.",
                        switchCamera:
                          "It is not possible to switch camera to different one because there is only one video device accessible.",
                        canvas: "Canvas is not supported.",
                      }}
                    />
                  )}
                </div>
              </DialogContent>
              {/* <ConnectionTest /> */}
              {/* <OnRampWidget
              transaction={tx?.transaction}
              onSuccessPayment={() => {
                //
              }}
            /> */}
            </div>
          </div>
        </Dialog>
      </AccountProvider>
    </NuqsAdapter>
  );
}
