import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

interface SquadDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
}

/** A Radix-based select, styled to match the app's dark/teal theme (plain CSS, no design system dependency). */
export function SquadDropdown({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SquadDropdownProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={`squad-dropdown__trigger ${className ?? ""}`}
        aria-label={ariaLabel}
      >
        <Select.Value />
        <Select.Icon className="squad-dropdown__chevron">
          <ChevronDown aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="squad-dropdown__content"
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className="squad-dropdown__viewport">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="squad-dropdown__item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="squad-dropdown__item-indicator">
                  <Check aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
