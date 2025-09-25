export type CheckType = "metadata" | "language";
export const METADATA = 0;
export const LANGUAGE = 1;
// Full user context stored on frontend after login
export interface UserContext {
  access_token: string;
  token_type?: string;        // optional, "bearer" usually
  username: string;
  roles: string[];
  permissions: string[];      // list of assigned permission keys
  languages_allowed: string[];
  permission_rules: PermissionRulesDict; // the actual rules with states
}


// A single permission rule, keyed by permission name (e.g. "SaveText")
export interface PermissionRuleSimple {
  metadata: (string | null)[];
  language: (string | null)[];
}



// One rule entry for a given permission (like "SaveText", "VerifyText")
export interface PermissionRuleEntry {
  metadata: (string | null)[];
  language: (string | null)[];
}

// Dictionary of all permission rules, keyed by permission name (_id in MongoDB)


// The shape of one permission rule returned from backend
export interface PermissionRuleSimple {
  metadata: (string | null)[];
  language: (string | null)[];
}
export type PermissionRulesDict = Record<string, PermissionRuleSimple>;

/**
 * Map permission keys -> UI actions they enable.
 * Extend freely as your app grows.
 */
  export const PERMISSION_TO_UI_ACTIONS: Record<string, string[]> = {
    SaveText: ["saveToDatabase"],
    ReleaseText: ["releaseToDatabase"],
    VerifyText: ["verifyData"],
    ApproveText: ["approveData"],
    RejectText: ["rejectData"],
    UploadPictures: ["uploadPicture", "identifyImage"],
    ViewDatabase: ["showDatabase"],
    SwitchToEditMode: ["switchToEditMode"], // ✅ keep this as the source of truth
    EditReleased: ["switchToEditMode"],
    ViewWorkList: ["viewWorkListWindow"],
    SkipToNextContributor: ["skipData"],
    SkipToNextReviewer: ["skipData"]
  };


export const UI_ACTION_TO_PERMISSIONS: Record<string, string[]> = Object.entries(
  PERMISSION_TO_UI_ACTIONS
).reduce((acc, [perm, actions]) => {
  actions.forEach((action) => {
    if (!acc[action]) acc[action] = [];
    acc[action].push(perm);
  });
  return acc;
}, {} as Record<string, string[]>);


export function canPerformUiAction(
  uiAction: string,
  checkType: CheckType, // "metadata" | "language"
  currentMetadataState: string | null,
  currentLanguageState: string | null,
  user: UserContext | null,
  permissionRulesOverride?: PermissionRulesDict | null
): boolean {
  if (!user) return false;

  console.log(`Checking if user ${user.username} can perform action "${uiAction}", with permission rules override:`, permissionRulesOverride);


  const permissionRules = permissionRulesOverride ?? user.permission_rules ?? null;
  if (!permissionRules) return false;

  // 🔑 Use ONLY the keys the backend gave us
  const userPerms = user.permissions || [];

  // Step 1: Collect all UI actions user can perform
  const allowedUiActions = new Set<string>();
  for (const permKey of userPerms) {
    const actions = PERMISSION_TO_UI_ACTIONS[permKey] || [];
    actions.forEach(action => allowedUiActions.add(action));
  }
  console.log(`User allowed UI actions:`, Array.from(allowedUiActions));

  // If this uiAction is not in user’s allowed set → deny
  if (!allowedUiActions.has(uiAction)) return false;

  // Step 2: Collect allowed states for this uiAction
  const allowedStates = new Set<string | null>();
  for (const permKey of userPerms) {
    const actions = PERMISSION_TO_UI_ACTIONS[permKey] || [];
    if (actions.includes(uiAction)) {
      const rule = permissionRules[permKey];
      if (!rule) continue;
      const states = checkType === "metadata" ? rule.metadata : rule.language;
      states.forEach(s => allowedStates.add(s));
    }
  }
  
  console.log(`Allowed states for action "${uiAction}":`, Array.from(allowedStates));
  // Step 3: Normalize and check current state
  const stateToCheck = checkType === "metadata" ? currentMetadataState : currentLanguageState;
  const stateNorm = stateToCheck === "" || stateToCheck === undefined ? null : stateToCheck;
  console.log(`State getting checked:`, stateNorm);
  return allowedStates.has(stateNorm);
}


export const RETURN_PERMISSION_ACTION: Record<string, string> = Object.fromEntries(
  Object.entries(PERMISSION_TO_UI_ACTIONS).flatMap(([perm, uiActions]) =>
    uiActions.map(ui => [ui, perm])
  )
);
