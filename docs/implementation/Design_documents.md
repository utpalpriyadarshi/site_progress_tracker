# Improvements
## Date 01-02-2026
### Action to be taken
#### For all improvement please create branch then implement succesfully, check for quality and errors, commit, create PR, Push to remote and merge.
## Improvements in Design Role
Design engineer will create design documents in the follwoing category
Add one more tab just after Dashboard
-Simulation/Study: This is very specific documents applicable to whole project.
-Instatallation: This is site specific design which will be used for used for installtion of design after approval from customer.
-Product/Equipment Application Design: Design from OEM shall be recived and submitted to customer for approval which will be used for site installation. This document is not site specific, it is applicable for whole project like Transformer, Cables etc once submitted and approved by customer can be used across the project sites.
-Installation design will be of various categories
-Layout Plan & Section
-Cable Tray Layout
-Cable schedule
-User can add as per project requirements
-As built Design
User should be give flexibility for CRUD principle.
-Please follow estabilished pattern of code 


I can't interact with the app UI directly. Here's how to test the full     
  workflow:
                                                                     1. Create a Category first (required before creating documents):
  - Tap the + FAB button → "Manage Categories"                               
  - Select a document type (e.g., "Installation")
  - You should see the 3 default categories already seeded (Layout Plan &    
  Section, Cable Tray Layout, Cable Schedule)
  - Try adding a custom category for another type (e.g., select
  "Simulation/Study" and add "Thermal Analysis")

  2. Create a Document:
  - Tap + FAB → "New Document"
  - Fill in: Document Number, Title, select Document Type, select Category   
  - If you pick Installation or As-Built, a Site dropdown will appear -      
  select a site
  - Tap "Create"

  3. Test Status Workflow:
  - On the created card (status: Draft), tap the send icon (arrow) → Submit  
  - Once Submitted, tap check icon → Approve, or comment-check icon → Approve
   with Comment, or X icon → Reject
  - For Approve with Comment / Reject, you'll need to enter a comment        

  4. Test Filters:
  - Tap document type chips (All, Simulation/Study, Installation, etc.)      
  - Tap status chips (Draft, Submitted, Approved, Rejected)
  - Use the search bar

  5. Test Edit/Delete:
  - On a Draft document, tap the pencil icon to edit, trash icon to delete   

  Let me know if anything doesn't work as expected.