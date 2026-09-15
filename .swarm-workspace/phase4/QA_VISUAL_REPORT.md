# QA Visual Report
## Status: PASSED

### Steps executed:
1. Navigated to `http://localhost:3000/login` and logged in with `hieu123@gmail.com` / `Mypassword@123`.
2. Successfully redirected to Projects Dashboard and clicked on "Dự án Master" to open the Kanban board.
3. Clicked "+ Thêm Cột" button, successfully handled the prompt dialog and added a new column named "Reviewing".
4. Moved the task to the "Reviewing" column using the combobox dropdown (selecting "Reviewing" option).
5. Reloaded the page (Navigate again to current URL).
6. Verified that the column "Reviewing" persists and the task correctly remains in the "Reviewing" column after refresh.

The implementation is robust and working as expected!
