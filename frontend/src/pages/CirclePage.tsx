import Item from "@/components/Item";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { circleItemType, memberType } from "@/lib/types";
import { useApp } from "@/stores/useApp";
import { useAuth } from "@/stores/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, LogOut, Users, Lock } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
export default function CirclePage() {
  const { id } = useParams();
  const { fetchCircle, joinCircle, leaveCircle, approveItem } = useApp();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false)
  const queryClient = useQueryClient();
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: async () => {
      const { getToken } = useClerkAuth();
      const token = await getToken({template: "default" });
      const res = await fetchCircle(id, token)
      return res;
    },
    staleTime: 300000,
    enabled: !!id,
  });

  const isJoined = data?.members?.some((m) => m.userId === user?.id);
  const isAdmin = data?.members?.some((m) => m.userId === user?.id && m.role === "ADMIN");

  const handleJoin = async () => {
    const { getToken } = useClerkAuth();
    const token = await getToken({template: "default" });
    setIsJoining(true);
    await joinCircle(id, token);
    await queryClient.invalidateQueries({ queryKey: ["circle", id] });
    setIsJoining(false);
  };

  const handleLeave = async () => {
    const { getToken } = useClerkAuth();
    const token = await getToken({template: "default" });
    setIsLeaving(true);
    await leaveCircle(id, token);
    await queryClient.invalidateQueries({ queryKey: ["circle", id] });
    setIsLeaving(false);
  };
  const handleApproveItem = async (id: string | undefined | number) => {
    const { getToken } = useClerkAuth();
    const token = await getToken({template: "default" });
    setIsApproving(true)
    await approveItem(id, token)
    await queryClient.invalidateQueries({ queryKey: ["circle", id] });
    setIsApproving(false)
  }
  const allVisibleItems = data?.items.filter(
    (it: circleItemType) => it.isApproved || isAdmin
  ) ?? [];
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      <div className="mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>


      </div>

      <div className="flex justify-between flex-wrap gap-6 items-start mb-10">
        {isLoading ? (
          <div className="flex gap-8 items-start animate-pulse">
            <div className="h-32 w-32 bg-muted rounded-xl" />
            <div className="space-y-3 max-w-2xl">
              <div className="h-6 w-48 bg-muted rounded-md" />
              <div className="h-4 w-80 bg-muted rounded-md" />
              <div className="h-4 w-32 bg-muted rounded-md" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-8 items-start">
              <img
                src={data?.image}
                alt="circle-logo"
                className="h-32 w-32 rounded-xl object-cover shadow-md"
              />
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl font-bold">{data?.name}</h1>
                <p className="text-muted-foreground text-base">
                  {data?.description}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {data?.members.length}{" "}
                  {data?.members.length === 1 ? "member" : "members"}
                </div>
              </div>
            </div>
            {isJoined ? (
              <Button
                className="shrink-0"
                variant="destructive"
                disabled={isLeaving}
                onClick={handleLeave}
              >
                {isLeaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut />
                    Leave
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="shrink-0"
                disabled={isJoining}
                onClick={handleJoin}
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join Circle"
                )}
              </Button>
            )}
          </>
        )}
      </div>


      <Separator className="mb-10" />

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-3 border-r pr-6">
          <h2 className="text-lg font-semibold mb-4">Members</h2>
          {data?.isPrivate && !isJoined ? (
            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2 text-center">
              <Lock className="w-6 h-6" />
              <span>This circle is private. Join to view members.</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {data?.members.map((member: memberType) => (
                <Link
                  key={member.id}
                  to={`/profile/${member.user.id}`}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition"
                >
                  <div className="rounded-full bg-muted h-9 w-9 flex items-center justify-center text-sm font-bold uppercase">
                    {member.user.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-9">
          <h2 className="text-lg font-semibold mb-6">Shared Items</h2>

          {data?.isPrivate && !isJoined ? (
            <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Lock className="w-6 h-6" />
              <span>This circle is private. Join to view shared items.</span>
            </div>
          ) : allVisibleItems.length === 0 ? (
            <p className="text-muted-foreground">No shared items yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {allVisibleItems.map((it: circleItemType) => (
                <div
                  key={it.id}
                  className="relative border p-4 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-full bg-muted h-9 w-9 flex items-center justify-center text-sm font-bold uppercase">
                      {it.user.name?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{it.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        shared an item
                      </p>
                    </div>
                    {it.isApproved ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : isAdmin ? (
                      <button
                        onClick={() => handleApproveItem(it.id)}
                        title="Approve item"
                        className="hover:text-green-500 transition cursor-pointer"
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-muted-foreground hover:text-green-500" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  <Item item={it.item} isBoost={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
