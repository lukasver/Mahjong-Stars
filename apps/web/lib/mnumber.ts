/**
 * Returns mNumber (1, 2, or 3) based on the current week.
 * Week 1 = 1, Week 2 = 2, Week 3 = 3, Week 4 = 1, etc.
 */
export function getMNumber(date: Date = new Date()): 1 | 2 | 3 {
	// Get week number by getting days since epoch and dividing by 7
	const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
	// Get number 1-3 based on week number
	const weekMod = (weekNumber % 3) + 1;

	return weekMod as 1 | 2 | 3;
}
