import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { get } from "./api";
import { useExpenses, type Expense } from "./expense-context";
import { useUser } from "./user-context";

export type BehaviorTimelineEntry = {
  day: string;
  date?: string;
  emoji: string;
  label: string;
  mood?: string | null;
};

export type CoachingSnapshot = {
  stats: {
    total_spent: number;
    today_spend: number;
    weekly_spend: number;
    expense_count: number;
  };
  analytics: {
    categories: Record<string, number>;
    trend: Record<string, number>;
  };
  coach: {
    headline?: string | null;
    behavior_insight?: string | null;
    detected_pattern?: string | null;
    confidence?: number | null;
    today_prediction?: string | null;
    coach_suggestion?: string | null;
  };
  personality: {
    type?: string;
    personality_type?: string;
    description?: string;
    confidence?: number;
    confidence_reason?: string;
    last_updated?: string;
    traits?: string[];
    strengths?: string[];
    growth_areas?: string[];
    dominant_trigger?: string | null;
    favorite_category?: string | null;
    behavior_narrative?: string;
    mindfulness_score?: number;
    risk_level?: string;
    coach_advice?: string;
    most_active_time?: string;
    behavior_evolution?: string;
    expenses_needed?: number;
  };
  trigger: {
    top_trigger?: string | null;
    today_trigger?: string | null;
    most_frequent_trigger?: string | null;
    mood_trigger?: string | null;
    time_trigger?: string | null;
    category_trigger?: string | null;
    weekend_trigger?: string | null;
    recurring_pattern?: string | null;
    trigger_frequency?: string | null;
    current_trigger_risk?: string | null;
    most_common_time?: string | null;
    most_common_mood?: string | null;
    triggers?: Array<Record<string, unknown>>;
  };
  nudge: {
    prediction?: string;
    upcoming_risk?: string;
    suggested_action?: string;
    trigger_behavior?: string;
    risk_level?: string;
    confidence?: number;
  };
  weekly: {
    weekly_narrative?: string | null;
    behavior_summary?: string | null;
    behavior_changes?: string | null;
    spending_pattern?: string | null;
    top_trigger?: string | null;
    biggest_improvement?: string | null;
    improvements?: string | null;
    regressions?: string | null;
    trigger_changes?: string | null;
    mood_changes?: string | null;
    category_trends?: string | null;
    personality_changes?: string | null;
    coach_recommendation?: string | null;
    one_win?: string | null;
    coach_advice?: string | null;
  };
  reflection: {
    insight?: string | null;
    summary?: string | null;
    latest_mood?: string | null;
    latest_trigger?: string | null;
  };
  journey: {
    milestones: Array<{
      title: string;
      date?: string | null;
      description?: string | null;
    }>;
  };
  behavior_timeline?: BehaviorTimelineEntry[];
  spend_dna?: {
    personality_type?: string;
    confidence?: number;
    traits?: string[];
    strengths?: string[];
    growth_areas?: string[];
    dominant_trigger?: string;
    favorite_category?: string;
    most_active_time?: string;
    behavior_pattern?: string;
    mindfulness_score?: number;
    risk_level?: string;
    coach_advice?: string;
    behavior_evolution?: string;
  };
  recent_expenses: Expense[];
};

type State = {
  snapshot: CoachingSnapshot | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "LOAD" }
  | { type: "SUCCESS"; payload: CoachingSnapshot }
  | { type: "ERROR"; payload: string }
  | { type: "CLEAR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { snapshot: action.payload, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    case "CLEAR":
      return { snapshot: null, loading: false, error: null };
    default:
      return state;
  }
}

type CoachingContextValue = State & {
  refetch: () => Promise<void>;
};

const CoachingContext = createContext<CoachingContextValue | null>(null);

export function CoachingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { expenses } = useExpenses();
  const expenseSignature = expenses.map((e) => `${e.id}:${e.amount}`).join("|");
  const [state, dispatch] = useReducer(reducer, {
    snapshot: null,
    loading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      dispatch({ type: "CLEAR" });
      return;
    }

    dispatch({ type: "LOAD" });
    try {
      const snapshot = await get<CoachingSnapshot>("/insights/coaching");
      dispatch({ type: "SUCCESS", payload: snapshot });
    } catch (error) {
      dispatch({
        type: "ERROR",
        payload: error instanceof Error ? error.message : "Unable to load AI coaching.",
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    void refetch();
  }, [refetch, expenseSignature]);

  return (
    <CoachingContext.Provider value={{ ...state, refetch }}>{children}</CoachingContext.Provider>
  );
}

export function useCoaching(): CoachingContextValue {
  const context = useContext(CoachingContext);
  if (!context) {
    throw new Error("useCoaching() must be used inside <CoachingProvider>.");
  }
  return context;
}
