# Bugs to resolve later

# 1.Once you've accepted the invitation we might need to refetch the data
At the current moment, even though I've accepted the invite we still see the "Accept Invite" card

# 2.Once the user's name is updated, we need to
- set that as default value again
- update the session cookie's name since its showing old data(because we're caching for 5 mins)

# ~~3. update the db-seed.ts - DONE~~
- so that we have different dates for created at

# 4. implement table view for data `/dashboard`
- with client-side sorting functionality

# ~~5. Implement filter and search functionality on `/dashboard` route - DONE~~

# 6. Implement filter and search functionality on `/boards/{boardId}` route

# 7. add functionality to update the column name

# ~~8. when the board name is the same, disable the "save button"~~
- same goes for user profile update
- when user enter same password in current password and newPassword throw an error
