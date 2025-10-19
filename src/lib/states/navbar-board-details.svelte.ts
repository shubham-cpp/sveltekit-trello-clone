interface BoardDetails {
	title?: string;
	color?: string;
}
export const boardDetails = $state<BoardDetails>({
	title: undefined,
	color: undefined
});
