import { PromptEditor } from '@/components/builder/prompt/prompt-editor';

export default function PromptPage() {
  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">프롬프트 편집</h1>
        <p className="text-muted-foreground">
          AI 어시스턴트의 성격과 응답 스타일을 설정합니다.
        </p>
      </div>
      <PromptEditor />
    </div>
  );
}
