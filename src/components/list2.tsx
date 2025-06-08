import {
  ArrowRight,
  UsersRound
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MarksDialog from "./marks-dialog";

interface ListItem {
  icon: React.ReactNode;
  title: string;
  category: string;
  link: string;
  disabled: boolean
}

interface List2Props {
  heading?: string;
  items?: ListItem[];
}

const List2 = ({
  heading = "Teams (5)",
  items = [
    {
      icon: <UsersRound />,
      title: "<Project Title>",
      category: "<Leader Name>",
      link: "#",
      disabled: false,
    },
    {
      icon: <UsersRound />,
      title: "<Project Title>",
      category: "<Leader Name>",
      link: "#",
      disabled: true,
    },
    {
      icon: <UsersRound />,
      title: "<Project Title>",
      category: "<Leader Name>",
      link: "#",
      disabled: false,
    },
    {
      icon: <UsersRound />,
      title: "<Project Title>",
      category: "<Leader Name>",
      link: "#",
      disabled: false,
    },
    {
      icon: <UsersRound />,
      title: "<Project Title>",
      category: "<Leader Name>",
      link: "#",
      disabled: false,
    },
  ],
}: List2Props) => {
  return (
    <section className=" pb-6 md:flex md:justify-center md:align-middle">
      <div className="container px-0 md:px-8 md:max-w-1/3">
      <Separator />
        <h1 className="my-5 px-4 text-3xl font-semibold md:text-4xl">
          {heading}
        </h1>
        <div className="flex flex-col">
          <Separator />
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center justify-around gap-10 px-4 py-5">
                <div className="flex items-center gap-2 md:order-none">
                  <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                    {item.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground ">
                      {item.category}
                    </p>
                  </div>
                </div>
                <MarksDialog></MarksDialog>
                {/* <Button variant="outlineDisabeld" asChild>
                  <a
                    className="order-3 ml-auto w-fit gap-2 md:order-none"
                    href={item.link}
                  >
                    <span>Mark Project</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button> */}
              </div>
              <Separator />
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export { List2 };
