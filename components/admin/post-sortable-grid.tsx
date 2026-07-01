"use client"

import type { ReactNode } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type PostDragHandleProps = {
  setHandleRef: (element: HTMLElement | null) => void
  handleProps: DraggableAttributes & SyntheticListenerMap
  isDragging: boolean
}

function SortablePostCard({
  id,
  children,
}: {
  id: string
  children: (handle: PostDragHandleProps) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    position: "relative" as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl ${isDragging ? "opacity-90 shadow-2xl ring-2 ring-[#1470AF]" : ""}`}
    >
      {children({
        setHandleRef: setActivatorNodeRef,
        handleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  )
}

type PostSortableGridProps<T extends { id: string }> = {
  items: T[]
  onReorder: (items: T[]) => void
  className?: string
  renderItem: (item: T, index: number, dragHandle: PostDragHandleProps) => ReactNode
}

export function PostSortableGrid<T extends { id: string }>({
  items,
  onReorder,
  className,
  renderItem,
}: PostSortableGridProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortablePostCard key={item.id} id={item.id}>
              {(dragHandle) => renderItem(item, index, dragHandle)}
            </SortablePostCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
