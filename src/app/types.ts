export type LineColor = "blue" | "green" | "amber" | "purple";

export interface Line {
  id: string;
  name: string;
  color: LineColor;
}

export const LINE_COLORS: LineColor[] = ["blue", "green", "amber", "purple"];

export const DEFAULT_LINES: Line[] = [
  { id: "line-1", name: "Formace 1", color: "blue" },
  { id: "line-2", name: "Formace 2", color: "green" },
  { id: "line-3", name: "Formace 3", color: "amber" },
];

export const LINE_COLOR_MAP: Record<LineColor, { header: string; activeBtn: string }> = {
  blue:   { header: "text-blue-600",   activeBtn: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200" },
  green:  { header: "text-green-600",  activeBtn: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" },
  amber:  { header: "text-amber-600",  activeBtn: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200" },
  purple: { header: "text-purple-600", activeBtn: "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200" },
};
