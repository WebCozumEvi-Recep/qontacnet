"use client";
import { useEffect, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  TodoList,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageInsert,
  Base64UploadAdapter,
  Alignment,
  Indent,
  IndentBlock,
  HorizontalLine,
  RemoveFormat,
  SourceEditing,
  FontColor,
  FontBackgroundColor,
  FontSize,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

export default function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 rounded-xl bg-surface-dim border border-white/10 animate-pulse" />;

  return (
    <div className="ck-dark">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials, Paragraph, Heading, Bold, Italic, Underline, Strikethrough,
            Link, List, TodoList, BlockQuote, Table, TableToolbar, TableProperties, TableCellProperties,
            MediaEmbed, Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert,
            Base64UploadAdapter, Alignment, Indent, IndentBlock, HorizontalLine, RemoveFormat,
            SourceEditing, FontColor, FontBackgroundColor, FontSize,
          ],
          toolbar: {
            items: [
              "undo", "redo", "|",
              "sourceEditing", "|",
              "heading", "|",
              "fontSize", "fontColor", "fontBackgroundColor", "|",
              "bold", "italic", "underline", "strikethrough", "removeFormat", "|",
              "link", "insertImage", "mediaEmbed", "insertTable", "blockQuote", "horizontalLine", "|",
              "alignment", "bulletedList", "numberedList", "todoList", "outdent", "indent",
            ],
            shouldNotGroupWhenFull: true,
          },
          heading: {
            options: [
              { model: "paragraph", title: "Paragraf", class: "ck-heading_paragraph" },
              { model: "heading1", view: "h1", title: "Başlık 1", class: "ck-heading_heading1" },
              { model: "heading2", view: "h2", title: "Başlık 2", class: "ck-heading_heading2" },
              { model: "heading3", view: "h3", title: "Başlık 3", class: "ck-heading_heading3" },
            ],
          },
          image: {
            toolbar: ["imageTextAlternative", "toggleImageCaption", "imageStyle:inline", "imageStyle:block", "imageStyle:side"],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
          },
          link: { defaultProtocol: "https://", addTargetToExternalLinks: true },
        }}
        onChange={(_e, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
