import React, { useMemo } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useParams, Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Subscription } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import ExportData from "./ExportData";

// --- Extended Type for Report ---
type SubscriptionWithCost = Subscription & { calculatedCost: number };

// --- Constants ---
const WEEKS_PER_MONTH = 52 / 12;

// --- Reusable Report Item ---
const ReportItem: React.FC<{
  subscription: SubscriptionWithCost;
  timeframe: string;
}> = ({ subscription, timeframe }) => (
  <Link
    to={`/subscriptions/${subscription.id}`}
    className="flex items-center justify-between bg-white p-4 rounded-lg border hover:border-indigo-300 transition-colors"
  >
    <div className="flex items-center space-x-4">
      <img
        src={
          subscription.logo_url ||`https://logo.clearbit.com/${subscription.name .toLowerCase().replace(/\s+/g, "")}.com`
        }
        alt={`Logo for ${subscription.name}`}
        className="h-10 w-10 rounded-full object-contain border"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = `https://placehold.co/40/EBF4FF/7F9CF5?text=${subscription.name.charAt(
            0
          )}`;
        }}
      />
      <div>
        <p className="font-semibold text-gray-800">{subscription.name}</p>
        <p className="text-sm text-gray-500">{subscription.category}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-lg text-gray-900">
        ${subscription.calculatedCost.toFixed(2)}
      </p>
      <p className="text-xs text-gray-500">per {timeframe}</p>
    </div>
  </Link>
);

// --- Main Reports Page ---
const ReportsPage: React.FC = () => {
  const { timeframe } = useParams();
  const { allSubscriptions, loading } = useSubscriptions({});

  // ✅ Safe timeframe handling
  const safeTimeframe: "week" | "month" | "annual" =
    timeframe === "week" || timeframe === "month" || timeframe === "annual"
      ? timeframe
      : "month";

  // --- Cost calculator ---
  const getCostForTimeframe = (
    sub: Subscription,
    tf: "week" | "month" | "annual"
  ): number => {
    const monthlyCost =
      sub.billing_cycle === "yearly"
        ? sub.cost / 12
        : sub.billing_cycle === "weekly"
        ? (sub.cost * 52) / 12
        : sub.cost;

    switch (tf) {
      case "week":
        return monthlyCost / WEEKS_PER_MONTH;
      case "annual":
        return monthlyCost * 12;
      case "month":
      default:
        return monthlyCost;
    }
  };

  // --- Build report data ---
  const { title, description, reportData, totalCost, timeframeLabel } =
    useMemo(() => {
      const activeSubs = allSubscriptions.filter((s) => s.is_active);

      const reportData: SubscriptionWithCost[] = activeSubs
        .map((sub) => ({
          ...sub,
          calculatedCost: getCostForTimeframe(sub, safeTimeframe),
        }))
        .sort((a, b) => b.calculatedCost - a.calculatedCost);

      const totalCost = reportData.reduce(
        (sum, sub) => sum + sub.calculatedCost,
        0
      );

      let title = "Report";
      let description = "";
      let timeframeLabel = "period";

      switch (safeTimeframe) {
        case "week":
          title = "Weekly Spending Report";
          description =
            "Your equivalent spending across all subscriptions per week.";
          timeframeLabel = "week";
          break;
        case "month":
          title = "Monthly Spending Report";
          description =
            "Your equivalent spending across all subscriptions per month.";
          timeframeLabel = "month";
          break;
        case "annual":
        default:
          title = "Annual Spending Report";
          description =
            "Your equivalent spending across all subscriptions per year.";
          timeframeLabel = "year";
          break;
      }

      return { title, description, reportData, totalCost, timeframeLabel };
    }, [allSubscriptions, safeTimeframe]);

  // --- Loading state ---
  if (loading) {
    return <LoadingSpinner message="Generating report..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>

      {/* Total Cost */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <p className="text-sm text-gray-500">
          Total Equivalent Spend for this Period
        </p>
        <p className="text-4xl font-bold text-indigo-600">
          ${totalCost.toFixed(2)}
        </p>
      </div>

      {/* Export Button */}
      <ExportData subscriptions={reportData} title={title} />

      {/* Breakdown */}
      {reportData.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <h3 className="text-xl font-semibold text-gray-800">
            No Active Subscriptions
          </h3>
          <p className="text-gray-500 mt-2">
            Add a subscription to see your spending reports.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Breakdown by Subscription
          </h3>
          {reportData.map((sub) => (
            <ReportItem
              key={sub.id}
              subscription={sub}
              timeframe={timeframeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
