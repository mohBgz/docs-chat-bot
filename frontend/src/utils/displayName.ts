export const displayName = (filename: string, maxLength: number = 20): string => {
	if (!filename) return "";

	// If already short enough, return as-is
	if (filename.length <= maxLength) return filename;

	const dotIndex = filename.lastIndexOf(".");
	const ext = dotIndex !== -1 ? filename.slice(dotIndex) : "";
	const name = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;

	// Reserve space for extension + "..."
	const available = maxLength - ext.length - 3; // 3 for "..."

	// Minimum chars to show on each side (to avoid "1...1234444444")
	const minSide = 3;

	// If even the minimum cannot fit, fallback safe
	if (available <= minSide * 2)
		return `${name.slice(0, minSide)}...${name.slice(-minSide)}${ext}`;

	// Distribute remaining characters
	const remaining = available - minSide * 2;
	const extraFront = Math.ceil(remaining / 2);
	const extraBack = Math.floor(remaining / 2);

	const front = name.slice(0, minSide + extraFront);
	const back = name.slice(-(minSide + extraBack));

	return `${front}...${back}${ext}`;
};
