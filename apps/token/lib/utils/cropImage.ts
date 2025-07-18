// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { Area, Point } from "react-easy-crop";

export const ASPECT_RATIOS = [
	{ value: 16 / 9, label: "16/9" },
	{ value: 4 / 3, label: "4/3" },
];

const createImage = (url): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", (error) => reject(error));
		image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
		image.src = url;
	});

function getRadianAngle(degreeValue) {
	return (degreeValue * Math.PI) / 180;
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 * @param {File} image - Image File url
 * @param {Object} pixelCrop - pixelCrop Object provided by react-easy-crop
 * @param {number} rotation - optional rotation parameter
 */
export default async function getCroppedImg(
	imageSrc,
	pixelCrop,
	rotation = 0,
): Promise<Blob> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	const maxSize = Math.max(image.width, image.height);
	const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

	// set each dimensions to double largest dimension to allow for a safe area for the
	// image to rotate in without being clipped by canvas context
	canvas.width = safeArea;
	canvas.height = safeArea;

	// translate canvas context to a central location on image to allow rotating around the center.
	ctx.translate(safeArea / 2, safeArea / 2);
	ctx.rotate(getRadianAngle(rotation));
	ctx.translate(-safeArea / 2, -safeArea / 2);

	// draw rotated image and store data.
	ctx.drawImage(
		image,
		safeArea / 2 - image.width * 0.5,
		safeArea / 2 - image.height * 0.5,
	);
	const data = ctx.getImageData(0, 0, safeArea, safeArea);

	// set canvas width to final desired crop size - this will clear existing context
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	// paste generated rotate image with correct offsets for x,y crop values.
	ctx.putImageData(
		data,
		Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
		Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y),
	);

	// As Base64 string
	// return canvas.toDataURL('image/jpeg');

	// As a blob
	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			resolve(blob);
		}, "image/*");
	});
}

export const useCropImage = ({ file }) => {
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [cropResult, setCropResult] = useState<{
		croppedArea: Area;
		croppedAreaPixels: Area;
	}>();
	const [zoom, setZoom] = useState(1);
	const [aspect, setAspect] = useState<number>(ASPECT_RATIOS[0].value);
	const [tempSrc, setTempSrc] = useState<string>();

	const reset = useCallback(() => {
		setCrop({ x: 0, y: 0 });
		setZoom(1);
		setAspect(ASPECT_RATIOS[0].value);
	}, []);

	const onCropComplete = useCallback(
		(croppedArea: Area, croppedAreaPixels: Area) => {
			setCropResult({ croppedArea, croppedAreaPixels });
		},
		[],
	);

	useEffect(() => {
		if (file) {
			setTempSrc(URL.createObjectURL(file));
		} else {
			setTempSrc(undefined);
		}
		return () => file && URL.revokeObjectURL(file);
	}, [file]);

	return {
		crop,
		zoom,
		aspect,
		setCrop,
		setZoom,
		setAspect,
		cropResult,
		onCropComplete,
		tempSrc,
		reset,
	};
};
