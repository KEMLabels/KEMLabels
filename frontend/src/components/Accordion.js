import React, { useState } from "react";
import {
  Accordion as AccordionNative,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "../styles/Global.css";

export default function Accordion({ value }) {
  const [activeAccordion, setActiveAccordion] = useState(null);
  function handleActiveAccordion(activeAccordion) {
    if (
      activeAccordion !== null &&
      activeAccordion !== undefined &&
      activeAccordion !== ""
    ) {
      setActiveAccordion(activeAccordion);
    }
  }

  return (
    <AccordionNative
      className="accordion"
      allowZeroExpanded
      onChange={handleActiveAccordion}
    >
      {value?.map(({ heading, content }, i) => {
        return (
          <AccordionItem
            key={i}
            uuid={`item${i}`}
            className={`accordionItem ${
              activeAccordion && activeAccordion[0] === `item${i}`
                ? "active"
                : ""
            }`}
          >
            <AccordionItemHeading>
              <AccordionItemButton className="accordionHeading">
                {heading}
                {activeAccordion && activeAccordion[0] === `item${i}` ? (
                  <FaChevronUp size={16} />
                ) : (
                  <FaChevronDown size={16} opacity={0.8} />
                )}
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className="accordionPanel">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </AccordionItemPanel>
          </AccordionItem>
        );
      })}
    </AccordionNative>
  );
}
