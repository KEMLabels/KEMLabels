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
      {value?.map(({ uid, heading, content }) => (
        <AccordionItem
          key={uid}
          uuid={`item${uid}`}
          className={`accordionItem ${
            activeAccordion && activeAccordion[0] === `item${uid}`
              ? "active"
              : ""
          }`}
        >
          <AccordionItemHeading>
            <AccordionItemButton className="accordionHeading">
              {heading}
              {activeAccordion && activeAccordion[0] === `item${uid}` ? (
                <FaChevronUp size={16} />
              ) : (
                <FaChevronDown size={16} opacity={0.8} />
              )}
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel className="accordionPanel">
            {content}
          </AccordionItemPanel>
        </AccordionItem>
      ))}
    </AccordionNative>
  );
}
