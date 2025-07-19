package com.mediconnect.util;

import com.mediconnect.model.Calendar;
import java.time.LocalDateTime;
import java.util.*;

public class SlotMergeUtil {

    /**
     * Simple merge of two sorted lists
     * Rules:
     * 1. Skip new slot if it overlaps with existing slot
     * 2. Skip new slot if gap is insufficient with existing slot
     *
     * @param existingSlots Already sorted list of existing slots
     * @param newSlots Already sorted list of new slots to add
     * @param gapMinutes Required gap between slots
     * @return Merged sorted list
     */
    public static List<Calendar.Slot> merge(List<Calendar.Slot> existingSlots,
                                            List<Calendar.Slot> newSlots,
                                            int gapMinutes) {

        List<Calendar.Slot> result = new ArrayList<>();
        int i = 0, j = 0;

        while (i < existingSlots.size() && j < newSlots.size()) {
            Calendar.Slot existing = existingSlots.get(i);
            Calendar.Slot newSlot = newSlots.get(j);

            if (existing.getStartTime().isBefore(newSlot.getStartTime())) {
                // Add existing slot first
                result.add(existing);
                i++;
            } else {
                // Check overlap with current existing slot
                if (isOverlapping(newSlot, existing)) {
                    // Skip new slot due to overlap
                    j++;
                    continue;
                }

                // Check overlap with previous existing slot (if exists)
                Calendar.Slot previousExisting = (i > 0) ? existingSlots.get(i - 1) : null;
                if (previousExisting != null && isOverlapping(newSlot, previousExisting)) {
                    // Skip new slot due to overlap with previous existing
                    j++;
                    continue;
                }

                // Check if new slot can be added (only gap checking now)
                if (canAddSlot(newSlot, result, existing, previousExisting, gapMinutes)) {
                    result.add(newSlot);
                }
                j++;
            }
        }

        // Add remaining existing slots
        while (i < existingSlots.size()) {
            result.add(existingSlots.get(i));
            i++;
        }

        // Add remaining new slots (if valid)
        while (j < newSlots.size()) {
            Calendar.Slot newSlot = newSlots.get(j);
            // Check overlap with last slot in result
            if (!result.isEmpty() && isOverlapping(newSlot, result.get(result.size() - 1))) {
                j++;
                continue;
            }

            if (canAddSlot(newSlot, result, null, null, gapMinutes)) {
                result.add(newSlot);
            }
            j++;
        }

        return result;
    }

    /**
     * Check if new slot can be added without violating gap rules
     * (Overlap checking is done in merge method)
     * @param newSlot The new slot to check
     * @param addedSlots Already added slots in result
     * @param currentExisting Current existing slot being compared (can be null)
     * @param previousExisting Previous existing slot (existing[i-1]) (can be null)
     * @param gapMinutes Required gap
     */
    private static boolean canAddSlot(Calendar.Slot newSlot, List<Calendar.Slot> addedSlots,
                                      Calendar.Slot currentExisting, Calendar.Slot previousExisting,
                                      int gapMinutes) {

        // Check gap with current existing slot (if provided)
        if (currentExisting != null) {
            if (hasInsufficientGap(newSlot, currentExisting, gapMinutes)) {
                return false;
            }
        }

        // Check gap with previous existing slot (existing[i-1])
        if (previousExisting != null) {
            if (hasInsufficientGap(newSlot, previousExisting, gapMinutes)) {
                return false;
            }
        }

        // Check gap with last added slot in result
        if (!addedSlots.isEmpty()) {
            Calendar.Slot lastAddedSlot = addedSlots.get(addedSlots.size() - 1);
            if (hasInsufficientGap(newSlot, lastAddedSlot, gapMinutes)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if two slots overlap
     */
    private static boolean isOverlapping(Calendar.Slot slot1, Calendar.Slot slot2) {
        return slot1.getStartTime().isBefore(slot2.getEndTime()) &&
                slot1.getEndTime().isAfter(slot2.getStartTime());
    }

    /**
     * Check if gap between slots is insufficient
     */
    private static boolean hasInsufficientGap(Calendar.Slot slot1, Calendar.Slot slot2, int gapMinutes) {
        LocalDateTime end1 = slot1.getEndTime();
        LocalDateTime start1 = slot1.getStartTime();
        LocalDateTime end2 = slot2.getEndTime();
        LocalDateTime start2 = slot2.getStartTime();

        long actualGap;

        // Case 1: slot1 comes before slot2
        if (end1.isBefore(start2) || end1.equals(start2)) {
            actualGap = java.time.Duration.between(end1, start2).toMinutes();
        }
        // Case 2: slot2 comes before slot1
        else if (end2.isBefore(start1) || end2.equals(start1)) {
            actualGap = java.time.Duration.between(end2, start1).toMinutes();
        }
        // Case 3: Overlapping slots (let overlap check handle this)
        else {
            return false;
        }

        return actualGap < gapMinutes;
    }
}