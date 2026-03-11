import { createNavigationContainerRef, CommonActions, StackActions } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name,
        params,
      })
    );
  }
}

export function navigateToCycleTab() {
  navigate("CycleTab");
}

export function navigateToProfileTab(screen?: string) {
  if (screen) {
    navigate("ProfileTab", { screen });
  } else {
    navigate("ProfileTab");
  }
}

export function navigateToScreen(tabName: string, screenName: string) {
  navigate(tabName, { screen: screenName });
}
