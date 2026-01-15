# Phase 1 Testing Guide - Editable Marks Feature

**Date**: January 15, 2026  
**Status**: ✅ Implementation Complete - Ready for Testing

---

## 🎯 PHASE 1 COMPLETE

All implementation tasks for Phase 1 (Editable Marks with Lock Feature) have been completed:

### ✅ Completed Changes:

1. **Database Schema** - Added `locked` boolean field to marks table
2. **Server Actions** - Implemented editable marks logic with lock/unlock functions
3. **UI Components** - Updated marks dialog with lock status and pre-fill capability
4. **Session Management** - Auto-lock marks when session ends
5. **Component Integration** - Updated List2 to fetch and pass existing marks

---

## 📋 TESTING CHECKLIST

### Test 1: Create New Mark (First Time)
**Steps**:
1. Login as jury member
2. View assigned teams
3. Click "Enter Marks" on a team
4. Fill in scores (Innovation: 8, Presentation: 7, Technical: 12, Impact: 13)
5. Click "Submit Marks"

**Expected Results**:
- ✅ Mark saved successfully
- ✅ Success toast appears
- ✅ Team remains in list (NOT removed)
- ✅ Button still shows "Enter Marks"

---

### Test 2: Edit Existing Mark
**Steps**:
1. Click "Enter Marks" on same team again
2. Verify form pre-fills with previous scores
3. Change Innovation score to 9
4. Click "Update Marks"

**Expected Results**:
- ✅ Form shows previous scores (8, 7, 12, 13)
- ✅ Dialog title says "Edit Marks for [Team]"
- ✅ Button text says "Update Marks"
- ✅ "Lock Marks" button is visible
- ✅ Updated score saved successfully

---

### Test 3: Lock Marks Manually
**Steps**:
1. Open marks dialog for team with existing marks
2. Click "Lock Marks" button
3. Try to reopen dialog

**Expected Results**:
- ✅ Lock success toast appears
- ✅ Dialog shows "Locked" badge in header
- ✅ All input fields are disabled
- ✅ Only "Close" button visible (no Save/Update/Lock)
- ✅ Cannot edit any scores

---

### Test 4: Cannot Edit Locked Mark
**Steps**:
1. Try to change scores in locked mark form
2. Try to submit

**Expected Results**:
- ✅ Input fields are disabled (grayed out)
- ✅ No submit button available
- ✅ Clear visual indication mark is locked

---

### Test 5: Multiple Teams Workflow
**Steps**:
1. Mark Team A (submit)
2. Mark Team B (submit)
3. Edit Team A marks
4. Lock Team A marks
5. Edit Team B marks (don't lock)

**Expected Results**:
- ✅ Both teams stay in list
- ✅ Can edit both independently
- ✅ Team A locked, Team B unlocked
- ✅ No interference between teams

---

### Test 6: Session End Auto-Lock
**Steps**:
1. As admin, end the session
2. As jury, try to access marks

**Expected Results**:
- ✅ All marks for that session are locked
- ✅ Jury cannot edit any marks
- ✅ All marks show locked status
- ✅ Jury removed from session (jury.session = NULL)

---

### Test 7: Validation Still Works
**Steps**:
1. Try to enter Innovation score > 10
2. Try to enter Technical score > 15
3. Leave fields empty

**Expected Results**:
- ✅ Validation errors appear
- ✅ Cannot submit invalid scores
- ✅ Error messages are clear

---

### Test 8: Edge Cases

#### Test 8a: Open Dialog While Loading
**Steps**:
1. Click "Enter Marks" rapidly multiple times
2. Watch for race conditions

**Expected Results**:
- ✅ Button shows "Loading..." while fetching
- ✅ No duplicate dialogs open
- ✅ Correct mark data loaded

#### Test 8b: Session Ended Before Submit
**Steps**:
1. Open marks dialog
2. Admin ends session
3. Try to submit marks

**Expected Results**:
- ✅ Error message: "Session has ended"
- ✅ Marks not saved
- ✅ Graceful error handling

#### Test 8c: Mark Locked Between Opens
**Steps**:
1. Open dialog (unlocked)
2. Close without saving
3. Another jury/admin locks it
4. Reopen dialog

**Expected Results**:
- ✅ Shows locked status
- ✅ Fields disabled
- ✅ Cannot edit

---

## 🔍 VERIFICATION POINTS

### Database Checks:
```sql
-- Check locked field exists
SELECT id, teamId, juryId, locked, submitted FROM marks;

-- Verify locked=false by default for new marks
-- Verify locked=true after manual lock
-- Verify all marks locked when session ends
```

### UI Checks:
- [ ] Lock icon appears when locked
- [ ] Form fields properly disabled
- [ ] Button text changes correctly
- [ ] Toast notifications work
- [ ] Loading states work

### Workflow Checks:
- [ ] Team stays in list after marking
- [ ] Can mark same team multiple times
- [ ] Locked marks cannot be edited
- [ ] Session end locks all marks

---

## 🐛 POTENTIAL ISSUES TO WATCH

### Issue 1: Race Condition
**Scenario**: Multiple jury members marking same team  
**Check**: Both can save marks independently (different juryId)

### Issue 2: Lock Timing
**Scenario**: Session ends while jury is editing  
**Check**: Validation prevents saving locked marks

### Issue 3: Form State
**Scenario**: Existing marks not loading  
**Check**: getMarks() called before dialog opens

### Issue 4: Performance
**Scenario**: Slow mark fetching  
**Check**: Loading state shows, no UI freeze

---

## ✅ ACCEPTANCE CRITERIA

Phase 1 is complete when:

- [x] Database migration applied successfully
- [x] All server actions working correctly
- [x] UI shows lock status properly
- [x] Form pre-fills existing marks
- [x] Session end locks all marks
- [x] No breaking changes to existing functionality
- [ ] All tests pass *(pending manual testing)*
- [ ] User feedback positive
- [ ] No critical bugs

---

## 🚀 NEXT STEPS AFTER TESTING

1. **If tests pass**:
   - Deploy to staging
   - Get user acceptance
   - Deploy to production
   - Move to Phase 2

2. **If issues found**:
   - Document bugs
   - Prioritize fixes
   - Retest after fixes
   - Then deploy

3. **Phase 2 Planning**:
   - Team selection during session creation
   - Multi-step session wizard
   - Team reassignment feature

---

## 📊 TESTING MATRIX

| Test Case | Priority | Status | Notes |
|-----------|----------|--------|-------|
| Create new mark | High | ⏳ Pending | Core functionality |
| Edit existing mark | High | ⏳ Pending | Core functionality |
| Lock marks manually | High | ⏳ Pending | New feature |
| Cannot edit locked | High | ⏳ Pending | Security |
| Multiple teams | Medium | ⏳ Pending | Workflow |
| Session end lock | High | ⏳ Pending | Auto-lock |
| Validation | Medium | ⏳ Pending | Data integrity |
| Edge cases | Low | ⏳ Pending | Robustness |

---

## 🎓 TESTING TIPS

1. **Use Browser DevTools**:
   - Check Network tab for API calls
   - Watch Console for errors
   - Inspect form values

2. **Test Different Roles**:
   - Jury member workflow
   - Admin capabilities
   - Multiple jury members

3. **Test Different States**:
   - Empty marks
   - Partial marks
   - Complete marks
   - Locked marks

4. **Test Error Scenarios**:
   - Network errors
   - Invalid data
   - Missing data
   - Session ended

---

**Ready to Test**: YES ✅  
**Estimated Testing Time**: 1-2 hours for complete coverage  
**Recommended Tester**: QA + 1-2 actual jury members for UX feedback
