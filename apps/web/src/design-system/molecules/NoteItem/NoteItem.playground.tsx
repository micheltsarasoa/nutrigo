import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { NoteItem } from "./NoteItem.tsx";

const list: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export default {
  title: "NoteItem",
  level: "molecule",
  states: {
    "two notes": (
      <ul style={list}>
        <NoteItem text="For added flavour, marinate the turkey in lemon juice and garlic for 30 minutes before grilling." />
        <NoteItem text="You can replace brown rice with quinoa or couscous for variety." />
      </ul>
    ),
    "long note": (
      <ul style={list}>
        <NoteItem text="Leftovers keep for three days in an airtight box in the fridge. Reheat the turkey gently in a covered pan with a splash of water so it stays juicy, and add the asparagus only for the last two minutes so it keeps its crunch and colour." />
      </ul>
    ),
    "single note": (
      <ul style={list}>
        <NoteItem text="Serve with a lemon wedge." />
      </ul>
    ),
  },
} satisfies Demo;
