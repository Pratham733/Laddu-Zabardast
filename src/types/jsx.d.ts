import type { HTMLAttributes, AllHTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      h1: React.DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      label: React.DetailedHTMLProps<AllHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;      ul: React.DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      li: React.DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      button: React.DetailedHTMLProps<AllHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      textarea: React.DetailedHTMLProps<AllHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
      input: React.DetailedHTMLProps<AllHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    }
  }
}
