import React from "react";
import { cn } from "@/lib/utils";

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  gap?: number;
}

interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  gap?: number;
}

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Row — A flex row layout wrapper.
 * Replaces `<div className="flex ...">` for horizontal layouts.
 */
export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ className, gap, children, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-row", className)}
      style={{ gap: gap !== undefined ? `${gap * 0.25}rem` : undefined, ...style }}
      {...props}
    >
      {children}
    </div>
  ),
);
Row.displayName = "Row";

/**
 * Column — A flex column layout wrapper.
 * Replaces `<div className="flex flex-col ...">` for vertical layouts.
 */
export const Column = React.forwardRef<HTMLDivElement, ColumnProps>(
  ({ className, gap, children, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      style={{ gap: gap !== undefined ? `${gap * 0.25}rem` : undefined, ...style }}
      {...props}
    >
      {children}
    </div>
  ),
);
Column.displayName = "Column";

/**
 * Container — A semantic page-level container.
 * Replaces the outermost `<div className="container ...">` wrapper on pages.
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("container mx-auto", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Container.displayName = "Container";

/**
 * Section — A semantic section wrapper.
 * Replaces `<div className="mt-... mb-...">` grouping blocks.
 */
export const Section = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(className)}
      {...props}
    >
      {children}
    </section>
  ),
);
Section.displayName = "Section";

/**
 * Box — A generic wrapper div for cases that don't fit Row/Column/Container semantics.
 * Use this instead of raw `<div>` for styling wrappers, conditional containers, etc.
 */
export const Box = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Box.displayName = "Box";
