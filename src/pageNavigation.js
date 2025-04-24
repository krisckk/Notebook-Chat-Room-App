export function getChatPageIndex(pages, roomID = null){
    if(roomID) {
        // Try to find specific chat room
        const index = pages.findIndex(page => 
            page.isChatPage && page.roomID === roomID
        );
        if(index >= 0) return index;
    }

    // Fallback to first chat page
    const firstChatIndex = pages.findIndex(page => page.isChatPage);
    return firstChatIndex >= 0 ? firstChatIndex : 0;
}