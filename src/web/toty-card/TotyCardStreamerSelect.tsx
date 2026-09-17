import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

/**
 * Lets the viewer jump straight to a different player's 3D card without
 * closing this popup first. Reuses TotyCardVariantSelect's exact trigger/
 * content/item CSS classes (plain translucent-black pill, not the app's
 * green accent) since the look is identical — only the values are
 * different (a streamer id here vs. a TotyCardVariant there), so a
 * dedicated Radix instance is simpler than trying to generalize that one
 * over two unrelated value types.
 */
export function TotyCardStreamerSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="toty-card-popup__variant-select-trigger" aria-label="선수 선택">
        <Select.Value />
        <Select.Icon className="toty-card-popup__variant-select-chevron">
          <ChevronDown aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="toty-card-popup__variant-select-content"
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className="toty-card-popup__variant-select-viewport">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="toty-card-popup__variant-select-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="toty-card-popup__variant-select-item-indicator">
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
