interface BoardDetails {
	title?: string
	color?: string
	filterCount: number
}
export const boardDetails = $state<BoardDetails>({
	title: undefined,
	color: undefined,
	filterCount: 0,
})
