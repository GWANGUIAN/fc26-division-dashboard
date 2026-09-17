import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { TotyCardVariant } from "./totyCardAssets.js";

/**
 * Manual card-theme switcher (기본/조카의 스케치북/90년대 고전 도트) shown
 * above a revealed card (TotyCardPopup). A dedicated Radix select rather than
 * reusing squad-builder/SquadDropdown — that one's shared class names carry
 * the app's green accent color, and this needs its own plain
 * translucent-black/pill look matching .toty-card-popup__download instead.
 */
export function TotyCardVariantSelect({
  value,
  onChange,
  options,
}: {
  value: TotyCardVariant;
  onChange: (value: TotyCardVariant) => void;
  options: { value: TotyCardVariant; label: string }[];
}) {
  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next as TotyCardVariant)}>
      <Select.Trigger className="toty-card-popup__variant-select-trigger" aria-label="카드 테마 선택">
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
