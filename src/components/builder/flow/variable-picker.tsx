'use client';

// =============================================================================
// Variable Picker Component
// =============================================================================
// 텍스트 입력 필드에서 변수 선택을 위한 팝오버 컴포넌트
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variable, Settings, User, Box, ChevronDown } from 'lucide-react';
import { useFlowStore } from '@/hooks/use-flow-store';
import type { AvailableVariable, VariableScope } from '@/types/variables';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface VariablePickerProps {
  /** 변수 선택 시 콜백 */
  onSelect: (variableRef: string) => void;
  /** 트리거 버튼 커스텀 */
  trigger?: React.ReactNode;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SCOPE_ICONS: Record<VariableScope, React.ComponentType<{ className?: string }>> = {
  system: Settings,
  session: User,
  nodes: Box,
};

const SCOPE_LABELS: Record<VariableScope, string> = {
  system: '시스템',
  session: '세션',
  nodes: '노드 출력',
};

const SCOPE_COLORS: Record<VariableScope, string> = {
  system: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  session: 'bg-green-500/10 text-green-600 border-green-500/20',
  nodes: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function VariablePicker({
  onSelect,
  trigger,
  disabled = false,
  className,
}: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const getAvailableVars = useFlowStore((state) => state.getAvailableVars);
  const variables = useMemo(() => getAvailableVars(), [getAvailableVars]);

  // Group variables by scope
  const groupedVariables = useMemo(() => {
    const filtered = search
      ? variables.filter(
          (v) =>
            v.label.toLowerCase().includes(search.toLowerCase()) ||
            v.description?.toLowerCase().includes(search.toLowerCase())
        )
      : variables;

    return {
      system: filtered.filter((v) => v.scope === 'system'),
      session: filtered.filter((v) => v.scope === 'session'),
      nodes: filtered.filter((v) => v.scope === 'nodes'),
    };
  }, [variables, search]);

  const handleSelect = useCallback(
    (variable: AvailableVariable) => {
      const ref = `{{${variable.label}}}`;
      onSelect(ref);
      setOpen(false);
      setSearch('');
    },
    [onSelect]
  );

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') {
      return value.length > 20 ? `"${value.slice(0, 20)}..."` : `"${value}"`;
    }
    if (typeof value === 'object') {
      return Array.isArray(value) ? `[${value.length}]` : '{...}';
    }
    return String(value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn('gap-2', className)}
          >
            <Variable className="h-4 w-4" />
            변수
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="변수 검색..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <ScrollArea className="h-64">
              {(['system', 'session', 'nodes'] as VariableScope[]).map((scope) => {
                const scopeVars = groupedVariables[scope];
                if (scopeVars.length === 0) return null;

                const Icon = SCOPE_ICONS[scope];

                return (
                  <CommandGroup
                    key={scope}
                    heading={
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{SCOPE_LABELS[scope]}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {scopeVars.length}
                        </Badge>
                      </div>
                    }
                  >
                    {scopeVars.map((variable) => (
                      <CommandItem
                        key={variable.label}
                        value={variable.label}
                        onSelect={() => handleSelect(variable)}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs truncate">
                            {variable.path}
                          </span>
                          {variable.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {variable.description}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('shrink-0 text-xs', SCOPE_COLORS[scope])}
                        >
                          {formatValue(variable.value)}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// -----------------------------------------------------------------------------
// Variable Input Component (Textarea with variable picker integration)
// -----------------------------------------------------------------------------

interface VariableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function VariableTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  className,
  label,
}: VariableTextareaProps) {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const handleVariableSelect = useCallback(
    (variableRef: string) => {
      if (!textareaRef) {
        onChange(value + variableRef);
        return;
      }

      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const newValue = value.slice(0, start) + variableRef + value.slice(end);
      onChange(newValue);

      // Focus and move cursor after inserted variable
      requestAnimationFrame(() => {
        textareaRef.focus();
        const newCursorPos = start + variableRef.length;
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [textareaRef, value, onChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        {label && <span className="text-sm font-medium">{label}</span>}
        <VariablePicker onSelect={handleVariableSelect} disabled={disabled} />
      </div>
      <textarea
        ref={setTextareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'font-mono resize-none'
        )}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Variable Input Component (Input with variable picker integration)
// -----------------------------------------------------------------------------

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function VariableInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  label,
}: VariableInputProps) {
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  const handleVariableSelect = useCallback(
    (variableRef: string) => {
      if (!inputRef) {
        onChange(value + variableRef);
        return;
      }

      const start = inputRef.selectionStart ?? value.length;
      const end = inputRef.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + variableRef + value.slice(end);
      onChange(newValue);

      // Focus and move cursor after inserted variable
      requestAnimationFrame(() => {
        inputRef.focus();
        const newCursorPos = start + variableRef.length;
        inputRef.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [inputRef, value, onChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        {label && <span className="text-sm font-medium">{label}</span>}
        <VariablePicker onSelect={handleVariableSelect} disabled={disabled} />
      </div>
      <input
        ref={setInputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'font-mono'
        )}
      />
    </div>
  );
}
