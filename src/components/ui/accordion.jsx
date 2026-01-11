import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const AccordionContext = React.createContext({ openItems: [], toggleItem: () => {} })

const Accordion = React.forwardRef(({ type = "single", collapsible, children, className, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState([])
  
  const toggleItem = (value) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? (collapsible ? [] : openItems) : [value])
    } else {
      setOpenItems(openItems.includes(value) 
        ? openItems.filter(item => item !== value)
        : [...openItems, value]
      )
    }
  }
  
  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div ref={ref} className={className} {...props}>{children}</div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, children, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} data-value={value} {...props}>
    {children}
  </div>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems, toggleItem } = React.useContext(AccordionContext)
  const value = props.value || React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(value)
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left w-full",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionItemContext = React.createContext(null)

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems } = React.useContext(AccordionContext)
  const value = props.value || React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(value)
  
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        isOpen ? "animate-accordion-down" : "animate-accordion-up hidden"
      )}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }